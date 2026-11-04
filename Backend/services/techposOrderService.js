const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_COMPANY_CODE = '467-41';
const DEFAULT_STORE_ID = '467';
const DEFAULT_TECHPOS_KEY = 'Ym9KsXaM3M7W2B301iI3ynU1';

/**
 * Format order into TechPOS OpenAPI order payload
 */
function buildTechPosPayload(order, storeId) {
  const isDelivery = order.fulfillment_type === 'delivery';

  // Extract numeric digits from order_number for externalIdentifier
  const numericExternalId = String(order.order_number || order.id).replace(/\D/g, '') || String(order.id);

  // Split customer_name into first and last
  const nameParts = (order.customer_name || 'Valued Customer').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Valued';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';

  // Build full delivery address string if delivery
  const deliveryAddress = isDelivery
    ? [order.address, order.city, order.postal_code, 'MB, Canada'].filter(Boolean).join(', ')
    : null;

  // Map products to TechPOS items
  const products = (order.items || []).map((item) => {
    // TechPOS productId must be numeric. If unavailable, try parsing or default to numeric hash
    const rawId = item.techpos_product_id || item.product_id;
    const numericProductId = !isNaN(Number(rawId)) ? Number(rawId) : 1;

    return {
      productId: numericProductId,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || 0,
    };
  });

  return {
    orderDate: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
    externalIdentifier: numericExternalId,
    storeId: Number(storeId),
    paymentAmount: Number(order.total) || 0,
    memberId: order.techpos_member_id || order.member_id || (order.user && order.user.techpos_member_id) ? Number(order.techpos_member_id || order.member_id || order.user.techpos_member_id) : null,
    isPaid: true,
    lastFourDigits: order.card_last4 || null,
    forDelivery: isDelivery,
    deliveryCost: isDelivery ? Number(order.shipping) || 0 : null,
    deliveryAddress: deliveryAddress,
    notes: order.notes || null,
    firstName: firstName,
    lastName: lastName,
    phone: order.customer_phone || '',
    email: order.customer_email || '',
    paymentCardType: order.card_brand || (order.payment_method === 'card' ? 'Visa' : 'None'),
    deliverySlot: null,
    expireDate: null,
    products: products.length > 0 ? products : [{ productId: 1, quantity: 1, unitPrice: Number(order.total) || 0 }],
  };
}

/**
 * Update online order status in TechPOS
 * e.g. status: 'ArrivedAtCustomer' to finalize and trigger TechPOS cloud stock decrement
 */
async function updateTechPosOrderStatus(orderId, status = 'ArrivedAtCustomer', branchId = 1) {
  const companyCode = process.env.TECHPOS_COMPANY_CODE || DEFAULT_COMPANY_CODE;
  const apiKey = process.env.TECHPOS_API_KEY || DEFAULT_TECHPOS_KEY;
  const targetUrl = `https://integrations-api.techpos.ca/${companyCode}/api/openAPI/updateOnlineOrderStatus`;

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'TechPOSAPIKey': apiKey,
      },
      body: JSON.stringify({
        branchId: Number(branchId),
        orderId: Number(orderId),
        status: status,
      }),
    });

    const responseText = await response.text();
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawText: responseText };
    }

    if (!response.ok) {
      console.warn(`[TechPOS Order Status Warning] HTTP ${response.status}:`, data);
      return { success: false, status: response.status, data };
    }

    console.log(`[TechPOS Order Status] ✓ Order #${orderId} status set to '${status}' in TechPOS`);
    return { success: true, status: response.status, data };
  } catch (err) {
    console.error(`[TechPOS Order Status Error]:`, err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Dispatch placed order to TechPOS OpenAPI
 * POST https://integrations-api.techpos.ca/{companyCode}/api/openAPI/order/{storeId}
 */
async function syncOrderToTechPOS(order) {
  const companyCode = process.env.TECHPOS_COMPANY_CODE || DEFAULT_COMPANY_CODE;
  const storeId = process.env.TECHPOS_STORE_ID || DEFAULT_STORE_ID;
  const apiKey = process.env.TECHPOS_API_KEY || DEFAULT_TECHPOS_KEY;

  const targetUrl = `https://integrations-api.techpos.ca/${companyCode}/api/openAPI/order/${storeId}`;

  const payload = buildTechPosPayload(order, storeId);

  console.log(`[TechPOS Order Sync] Dispatching order #${order.order_number} to: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'TechPOSAPIKey': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawText: responseText };
    }

    if (!response.ok) {
      console.warn(`[TechPOS Order Sync Warning] HTTP ${response.status}:`, data);
      return {
        success: false,
        status: response.status,
        message: data.message || data.error || `TechPOS returned HTTP ${response.status}`,
        techpos_order_id: null,
      };
    }

    // Success response handling
    const techposOrderId = data.orderId || data.data?.orderId || data.id || null;

    console.log(`[TechPOS Order Sync] ✓ Order #${order.order_number} successfully posted to TechPOS. ID: ${techposOrderId}`);

    // If order was created in TechPOS, auto-finalize to 'ArrivedAtCustomer'
    // so TechPOS immediately deducts the quantity from its cloud stock
    if (techposOrderId) {
      try {
        const branchId = process.env.TECHPOS_BRANCH_ID || 1;
        await updateTechPosOrderStatus(techposOrderId, 'ArrivedAtCustomer', branchId);
      } catch (statusErr) {
        console.warn(`[TechPOS Order Sync] Status transition warning:`, statusErr.message);
      }
    }

    return {
      success: true,
      status: response.status,
      techpos_order_id: techposOrderId ? String(techposOrderId) : null,
      message: 'Order synced to TechPOS successfully',
      data,
    };
  } catch (networkError) {
    console.error(`[TechPOS Order Sync Error] Network failure:`, networkError.message);
    return {
      success: false,
      message: networkError.message,
      techpos_order_id: null,
    };
  }
}

module.exports = {
  buildTechPosPayload,
  syncOrderToTechPOS,
  updateTechPosOrderStatus,
};

