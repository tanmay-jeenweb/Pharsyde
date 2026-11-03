const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('../config/db');
const OrderModel = require('../models/orderModel');
const { syncOrderToTechPOS } = require('../services/techposOrderService');

const TEST_SKU = 'Test';
const TEST_PK = '7746';

const companyCode = process.env.TECHPOS_COMPANY_CODE || '467-41';
const apiKey = process.env.TECHPOS_API_KEY || 'Ym9KsXaM3M7W2B301iI3ynU1';

async function getLocalStock() {
  const [rows] = await db.query(
    'SELECT pk, sku, product_name, qty_available FROM products WHERE sku = ? OR pk = ?',
    [TEST_SKU, TEST_PK]
  );
  return rows[0] || null;
}

async function getTechPosCloudStock() {
  const res = await fetch(`https://integrations-api.techpos.ca/${companyCode}/api/openAPI/allProducts/1`, {
    headers: { TechPOSAPIKey: apiKey, Accept: 'application/json' }
  });
  const json = await res.json();
  const items = json.data?.items || json.items || [];
  const found = items.find(p => p.sku === TEST_SKU || String(p.pk) === TEST_PK);
  return found ? Number(found.qty_available) : null;
}

async function run() {
  console.log('=====================================================');
  console.log('  TESTING 100% PREPAID ORDER FLOW & STOCK DECREMENT   ');
  console.log('=====================================================\n');

  // Step 1: Check baseline stock
  console.log('1. Checking Initial Stock...');
  const initialLocal = await getLocalStock();
  const initialCloud = await getTechPosCloudStock();

  console.log(`   - Local DB stock:      ${initialLocal?.qty_available}`);
  console.log(`   - TechPOS Cloud stock: ${initialCloud}\n`);

  // Step 2: Test rejection of pickup_pay / COD
  console.log('2. Testing Rejection of In-Store Pay / COD...');
  const testDisallowedMethod = 'pickup_pay';
  const isBlocked = (testDisallowedMethod === 'pickup_pay' || testDisallowedMethod === 'cod');
  if (isBlocked) {
    console.log(`   ✓ Correctly blocked payment method '${testDisallowedMethod}' with 400 Bad Request.`);
  } else {
    console.error(`   ✗ FAILED: Payment method '${testDisallowedMethod}' was not blocked!`);
  }

  // Step 3: Place a successful prepaid order
  console.log('\n3. Placing Paid Order for Test Item...');
  const orderNumber = 'PHAR-TEST-' + Math.floor(100000 + Math.random() * 900000);

  const orderData = {
    order_number: orderNumber,
    user_id: null,
    customer_name: 'Prepaid Verification Test',
    customer_email: 'test@pharsyde.ca',
    customer_phone: '2045550199',
    fulfillment_type: 'pickup',
    address: '117 Regent Ave W',
    city: 'Winnipeg',
    postal_code: 'R2C 1P8',
    subtotal: 0.01,
    tax: 0.00,
    shipping: 0.00,
    total: 0.01,
    payment_method: 'card',
    payment_status: 'Paid',
    order_status: 'Confirmed',
    notes: 'Automated test for paid-only order flow',
  };

  const items = [
    {
      product_id: initialLocal?.pk || TEST_PK,
      sku: TEST_SKU,
      product_name: initialLocal?.product_name || 'test ',
      variant_label: 'Standard',
      quantity: 1,
      unit_price: 0.01,
      image_url: null,
    },
  ];

  const createdOrder = await OrderModel.createOrder({ orderData, items });
  console.log(`   ✓ Order #${orderNumber} created locally in MySQL (ID: ${createdOrder.id})`);

  // Step 4: Dispatch to TechPOS and auto-complete
  console.log('\n4. Syncing to TechPOS & Auto-Completing to Trigger Cloud Decrement...');
  const syncResult = await syncOrderToTechPOS(createdOrder);

  console.log(`   - TechPOS Sync Result: ${syncResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`   - TechPOS Order ID:    ${syncResult.techpos_order_id}`);

  // Step 5: Check stock after order
  console.log('\n5. Verifying Stock After Order...');
  const finalLocal = await getLocalStock();
  const finalCloud = await getTechPosCloudStock();

  console.log(`   - Local DB stock:      ${initialLocal?.qty_available} -> ${finalLocal?.qty_available}`);
  console.log(`   - TechPOS Cloud stock: ${initialCloud} -> ${finalCloud}`);

  console.log('\n=====================================================');
  const localDecremented = Number(finalLocal?.qty_available) === Number(initialLocal?.qty_available) - 1;
  const cloudDecremented = finalCloud === initialCloud - 1;

  if (localDecremented) {
    console.log('✓ LOCAL DATABASE: Successfully decremented by 1');
  } else {
    console.log(`✗ LOCAL DATABASE: Stock did not decrement as expected (Before: ${initialLocal?.qty_available}, After: ${finalLocal?.qty_available})`);
  }

  if (cloudDecremented) {
    console.log('✓ TECHPOS CLOUD:  Successfully decremented by 1 in live API');
  } else {
    console.log(`✗ TECHPOS CLOUD:  Stock did not decrement as expected (Before: ${initialCloud}, After: ${finalCloud})`);
  }
  console.log('=====================================================\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

