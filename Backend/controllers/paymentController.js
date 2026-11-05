const crypto = require('crypto');
const pool = require('../config/db');
const { calculateOrderTaxesCents } = require('../utils/taxCalculator');
const { validateCannabisLimit } = require('../utils/cannabisLimit');
const PaymentAttemptModel = require('../models/paymentAttemptModel');
const OrderModel = require('../models/orderModel');
const SettingModel = require('../models/settingModel');
const UserModel = require('../models/userModel');
const { getNextOrderNumber } = require('../services/orderSequenceService');
const { preloadMonerisCheckout, getMonerisReceipt, getMonerisConfig, MonerisGatewayError } = require('../services/monerisService');
const { getLiveTechPosStock } = require('../services/techposInventoryService');
const { syncOrderToTechPOS } = require('../services/techposOrderService');
const {
  generateGuestCheckoutToken,
  hashGuestCheckoutToken,
  getGuestCheckoutToken,
  isGuestCheckoutTokenValid,
  setGuestCheckoutTokenCookie,
} = require('../services/guestTokenService');

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function moneyToCents(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100);
}

function generateMerchantOrderNumber() {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PHR${timestamp}${randomSuffix}`;
}

/**
 * @route   POST /api/payments/moneris/preload
 * @desc    Validate cart/stock, create PaymentAttempt, and request Moneris ticket S2S
 * @access  Public (Guest or Authenticated Customer)
 */
const initiatePaymentAttempt = async (req, res, next) => {
  try {
    const {
      items = [],
      customer = {},
      fulfillmentType = 'pickup',
      address = '',
      city = 'Winnipeg',
      postalCode = '',
      paymentMethod = 'credit',
      notes = '',
      gov_id_url = null,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add items to proceed.',
      });
    }

    const authUser = req.user || null;
    const isGuest = !authUser;

    // Resolve Customer Information
    const firstName = cleanText(customer.firstName) || (authUser?.name ? authUser.name.split(' ')[0] : 'Valued');
    const lastName = cleanText(customer.lastName) || (authUser?.name ? authUser.name.split(' ').slice(1).join(' ') : 'Customer');
    const customerName = `${firstName} ${lastName}`.trim();
    const customerEmail = cleanText(customer.email) || authUser?.email || '';
    const customerPhone = cleanText(customer.phone) || authUser?.mob_no || '';

    if (!customerEmail || !customerEmail.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required for receipt delivery.',
      });
    }

    // If guest, verify email does not belong to an existing registered user
    if (isGuest && customerEmail) {
      const existingUser = await UserModel.findByEmail(customerEmail.toLowerCase());
      if (existingUser) {
        return res.status(400).json({
          success: false,
          code: 'ACCOUNT_EXISTS',
          message: 'An account with this email already exists. Please log in to complete your order.',
        });
      }
    }

    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'A valid contact phone number is required.',
      });
    }

    // Validate Courier Address
    const isDelivery = fulfillmentType === 'delivery';
    const deliveryAddress = cleanText(address || customer.address);
    const deliveryPostal = cleanText(postalCode || customer.postalCode);

    if (isDelivery && (!deliveryAddress || !deliveryPostal)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address and postal code are required for courier orders.',
      });
    }

    // Check if Government ID upload is mandatory
    const isGovIdMandatory = (await SettingModel.getValue('gov_id_mandatory', 'false')) === 'true';
    const uploadedIdUrl = customer.govIdUrl || customer.gov_id_url || gov_id_url || req.body.govIdUrl || null;
    if (isGovIdMandatory && !uploadedIdUrl) {
      return res.status(400).json({
        success: false,
        code: 'GOV_ID_REQUIRED',
        message: 'A valid government-approved ID document is required to proceed with checkout.',
      });
    }

    // Live Stock Validation & Calculation
    const normalizedItems = [];
    let subtotalCents = 0;

    for (const [index, item] of items.entries()) {
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const rawPrice = item.unit_price ?? item.price ?? item.variant?.price ?? 0;
      const unitPriceCents = moneyToCents(rawPrice);
      const lineTotalCents = unitPriceCents * quantity;
      subtotalCents += lineTotalCents;

      const productId = item.product_id || item.productId || item.pk || item.id || null;
      const techPosProductId = item.techpos_product_id || item.techPosProductId || null;
      const sku = item.sku || null;
      const productName = item.product_name || item.name || item.product?.name || 'Cannabis Selection';

      // Verify live stock
      const stockResult = await getLiveTechPosStock({
        productId: techPosProductId || productId,
        sku,
      });

      if (stockResult.found) {
        if (stockResult.stock <= 0) {
          return res.status(409).json({
            success: false,
            code: 'INSUFFICIENT_INVENTORY',
            message: `"${productName}" is currently out of stock. Please adjust your cart.`,
          });
        }
        if (quantity > stockResult.stock) {
          return res.status(409).json({
            success: false,
            code: 'INSUFFICIENT_INVENTORY',
            message: `Only ${stockResult.stock} units of "${productName}" are available (you requested ${quantity}).`,
          });
        }
      }

      normalizedItems.push({
        product_id: productId,
        techpos_product_id: techPosProductId,
        sku,
        product_name: productName,
        variant_label: item.variant_label || item.variant?.label || 'Standard',
        quantity,
        unit_price: unitPriceCents / 100,
        unit_price_cents: unitPriceCents,
        line_total: lineTotalCents / 100,
        line_total_cents: lineTotalCents,
        category: item.category || item.product?.category || null,
        image_url: item.image_url || item.image || item.imageUrl || null,
      });
    }

    // Fetch missing categories from DB for accurate item-level tax classification
    const missingProductIds = normalizedItems
      .filter((i) => !i.category)
      .map((i) => i.product_id || i.techpos_product_id)
      .filter(Boolean);

    let categoryMap = {};
    if (missingProductIds.length > 0) {
      try {
        const [rows] = await pool.query(
          `SELECT pk, category, equivalent_g FROM products WHERE pk IN (${missingProductIds.map(() => '?').join(',')})`,
          missingProductIds
        );
        for (const row of rows) {
          categoryMap[row.pk] = { category: row.category, equivalent_g: row.equivalent_g };
        }
      } catch (catErr) {
        console.warn('[Payment Tax] DB category lookup warning:', catErr.message);
      }
    }

    const itemsForTax = normalizedItems.map((i) => {
      const pid = String(i.product_id || i.techpos_product_id || '');
      return {
        ...i,
        category: i.category || categoryMap[pid]?.category || '',
        equivalent_g: i.equivalent_g ?? categoryMap[pid]?.equivalent_g,
      };
    });

    // Legal Cannabis Purchase Limit Check (Configured in Setting Master)
    const configuredLimitStr = await SettingModel.getValue('cannabis_max_grams', '30.0');
    const configuredLimit = parseFloat(configuredLimitStr) || 30.0;
    const limitValidation = validateCannabisLimit(itemsForTax, configuredLimit);
    if (!limitValidation.valid) {
      return res.status(400).json({
        success: false,
        code: 'CANNABIS_LIMIT_EXCEEDED',
        message: limitValidation.message,
        totalGrams: limitValidation.totalGrams,
        maxGrams: limitValidation.maxGrams,
        excessGrams: limitValidation.excessGrams,
      });
    }

    // Free Delivery Threshold Check (Configured in Setting Master)
    const configuredThresholdStr = await SettingModel.getValue('free_delivery_threshold', '75.0');
    const freeDeliveryThreshold = parseFloat(configuredThresholdStr) || 75.0;
    const FREE_SHIPPING_THRESHOLD_CENTS = Math.round(freeDeliveryThreshold * 100);
    const shippingCents = isDelivery && subtotalCents < FREE_SHIPPING_THRESHOLD_CENTS ? 999 : 0;

    // Differential Tax Calculation: 5% Cannabis, 7% Nicotine
    const taxSummary = calculateOrderTaxesCents(itemsForTax, {
      discountCents: 0,
      shippingCents,
    });

    const gstCents = taxSummary.totalGstCents;
    const pstCents = taxSummary.totalPstCents;
    const taxCents = taxSummary.totalTaxCents;
    const totalCents = taxSummary.totalCents;

    // Generate Identifiers
    const merchantOrderNumber = generateMerchantOrderNumber();
    const attemptNumber = `ATT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let guestToken = '';
    let guestTokenHash = null;

    if (isGuest) {
      guestToken = generateGuestCheckoutToken();
      guestTokenHash = hashGuestCheckoutToken(guestToken);
    }

    // Create PaymentAttempt in MySQL
    const paymentAttempt = await PaymentAttemptModel.create({
      attempt_number: attemptNumber,
      user_id: authUser ? authUser.id : null,
      guest_token_hash: guestTokenHash,
      order_type: fulfillmentType,
      subtotal_cents: subtotalCents,
      gst_cents: gstCents,
      pst_cents: pstCents,
      tax_cents: taxCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: 'CAD',
      items: normalizedItems,
      customer_info: {
        firstName,
        lastName,
        fullName: customerName,
        email: customerEmail,
        phone: customerPhone,
        paymentMethod: paymentMethod || customer.paymentMethod || 'credit',
        govIdUrl: customer.govIdUrl || customer.gov_id_url || gov_id_url || req.body.govIdUrl || null,
        notes,
      },
      shipping_address: isDelivery
        ? {
            address: deliveryAddress,
            city,
            postalCode: deliveryPostal,
            country: 'Canada',
          }
        : null,
      merchant_order_number: merchantOrderNumber,
    });

    // Moneris Preload Request (S2S)
    const preloadResult = await preloadMonerisCheckout({
      totalCents,
      merchantOrderNumber,
    });

    // Update payment attempt with ticket
    await PaymentAttemptModel.updatePreloadTicket(
      paymentAttempt.id,
      preloadResult.ticket,
      preloadResult.rawSafeResponse
    );

    // If guest, set secure HttpOnly cookie
    if (guestToken) {
      setGuestCheckoutTokenCookie(res, guestToken);
    }

    return res.status(200).json({
      success: true,
      ticket: preloadResult.ticket,
      paymentAttemptId: paymentAttempt.id,
      attemptNumber: paymentAttempt.attempt_number,
      merchantOrderNumber,
      amount: preloadResult.amount,
      totalCents,
      environment: preloadResult.environment,
      checkoutMode: preloadResult.checkoutMode,
      checkoutScriptUrl: preloadResult.checkoutScriptUrl,
    });
  } catch (error) {
    if (error instanceof MonerisGatewayError) {
      return res.status(502).json({
        success: false,
        code: error.code,
        message: error.message || 'Payment gateway could not initialize checkout session.',
      });
    }
    next(error);
  }
};

/**
 * @route   POST /api/payments/moneris/finalize
 * @desc    Authoritative S2S receipt verification, concurrency lock, PHR-100xxx creation & TechPOS sync
 * @access  Public (Validated by JWT or Guest Token)
 */
const finalizePayment = async (req, res, next) => {
  try {
    const { paymentAttemptId, ticket = '' } = req.body;

    if (!paymentAttemptId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required paymentAttemptId.',
      });
    }

    // 1. Load Payment Attempt
    let attempt = null;
    if (!isNaN(Number(paymentAttemptId))) {
      attempt = await PaymentAttemptModel.findById(Number(paymentAttemptId));
    }
    if (!attempt) {
      attempt = await PaymentAttemptModel.findByAttemptNumber(String(paymentAttemptId));
    }

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Payment attempt session was not found.',
      });
    }

    // 2. Verify Caller Ownership
    const authUser = req.user || null;
    if (attempt.user_id) {
      if (!authUser || authUser.id !== attempt.user_id) {
        return res.status(403).json({
          success: false,
          code: 'AUTH_FORBIDDEN',
          message: 'You are not authorized to finalize this payment attempt.',
        });
      }
    } else if (attempt.guest_token_hash) {
      const guestToken = getGuestCheckoutToken(req);
      const isValid = isGuestCheckoutTokenValid(guestToken, attempt.guest_token_hash);
      if (!isValid) {
        return res.status(403).json({
          success: false,
          code: 'GUEST_TOKEN_INVALID',
          message: 'Guest checkout verification token is missing or invalid.',
        });
      }
    }

    // 3. Verify Ticket Matches
    const requestTicket = cleanText(ticket);
    if (requestTicket && attempt.moneris_ticket && attempt.moneris_ticket !== requestTicket) {
      return res.status(403).json({
        success: false,
        code: 'PAYMENT_TICKET_INVALID',
        message: 'Payment verification ticket does not match session.',
      });
    }

    const verificationTicket = requestTicket || attempt.moneris_ticket;
    if (!verificationTicket) {
      return res.status(409).json({
        success: false,
        message: 'Moneris verification ticket is missing from attempt.',
      });
    }

    // 4. Idempotency Check: Already Finalized?
    if (attempt.final_order_id) {
      const [existingOrders] = await OrderModel.findById(attempt.final_order_id).catch(() => [null]);
      if (existingOrders) {
        return res.status(200).json({
          success: true,
          approved: true,
          orderCreated: true,
          alreadyFinalized: true,
          order: existingOrders,
        });
      }
    }

    if (attempt.status === 'cancelled') {
      return res.status(409).json({
        success: false,
        approved: false,
        orderCreated: false,
        code: 'PAYMENT_CANCELLED',
        message: 'This payment transaction was cancelled.',
      });
    }

    // 5. Acquire Atomic Concurrency Lock
    const lockAcquired = await PaymentAttemptModel.acquireFinalizationLock(attempt.id);
    if (!lockAcquired) {
      // Re-check if completed while waiting
      const refreshed = await PaymentAttemptModel.findById(attempt.id);
      if (refreshed?.final_order_id) {
        const order = await OrderModel.findById(refreshed.final_order_id);
        return res.status(200).json({
          success: true,
          approved: true,
          orderCreated: true,
          alreadyFinalized: true,
          order,
        });
      }

      return res.status(409).json({
        success: false,
        code: 'PAYMENT_FINALIZATION_IN_PROGRESS',
        message: 'Finalization is currently in progress for this payment.',
      });
    }

    // 6. Direct S2S Moneris Receipt Query
    let receipt;
    try {
      receipt = await getMonerisReceipt(verificationTicket);
    } catch (monerisErr) {
      await PaymentAttemptModel.markFinalizationFailed(attempt.id, monerisErr.message);
      return res.status(502).json({
        success: false,
        code: 'PAYMENT_RECEIPT_UNAVAILABLE',
        message: 'Your payment was received, but Moneris is still confirming verification. Please do not pay again.',
      });
    }

    // 7. Authoritative Verification Checks
    if (receipt.isSandboxMock) {
      receipt.amountCents = attempt.total_cents;
      receipt.amount = attempt.total_cents / 100;
      receipt.merchantOrderNumber = attempt.merchant_order_number;
    }

    if (!receipt.approved) {
      await PaymentAttemptModel.markFinalizationFailed(attempt.id, receipt.responseMessage || 'Payment was declined', {
        status: 'declined',
        failure_reason: receipt.responseMessage || 'Card declined by issuing bank.',
        moneris_response: receipt.rawSafeResponse,
      });

      return res.status(200).json({
        success: true,
        approved: false,
        orderCreated: false,
        message: receipt.responseMessage || 'Payment was declined by your bank.',
      });
    }

    // Check Order Reference
    if (receipt.merchantOrderNumber && receipt.merchantOrderNumber !== attempt.merchant_order_number) {
      await PaymentAttemptModel.markFinalizationFailed(attempt.id, 'Order reference mismatch', {
        status: 'failed',
        failure_reason: 'Moneris returned an order reference that does not match this payment attempt.',
      });
      return res.status(409).json({
        success: false,
        code: 'PAYMENT_REFERENCE_MISMATCH',
        message: 'Verified payment order reference does not match this checkout session.',
      });
    }

    // Strict Integer Cents Comparison
    if (receipt.amountCents === null || receipt.amountCents !== attempt.total_cents) {
      await PaymentAttemptModel.markFinalizationFailed(attempt.id, 'Payment amount mismatch', {
        status: 'failed',
        failure_reason: `Expected ${attempt.total_cents} cents, received ${receipt.amountCents} cents.`,
      });
      return res.status(409).json({
        success: false,
        code: 'PAYMENT_AMOUNT_MISMATCH',
        message: 'Verified payment amount does not match expected order total.',
      });
    }

    // 8. Atomic Order Creation (PHR-100xxx)
    const orderNumber = await getNextOrderNumber();
    const customerInfo = attempt.customer_info || {};
    const shippingAddress = attempt.shipping_address || {};

    const createdOrder = await OrderModel.createOrder({
      orderData: {
        order_number: orderNumber,
        user_id: attempt.user_id,
        customer_name: customerInfo.fullName || `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'Valued Customer',
        customer_email: customerInfo.email || '',
        customer_phone: customerInfo.phone || '',
        fulfillment_type: attempt.order_type || 'pickup',
        address: shippingAddress.address || '',
        city: shippingAddress.city || 'Winnipeg',
        postal_code: shippingAddress.postalCode || '',
        subtotal: attempt.subtotal_cents / 100,
        tax: attempt.tax_cents / 100,
        shipping: attempt.shipping_cents / 100,
        total: attempt.total_cents / 100,
        payment_method: customerInfo.paymentMethod === 'debit' ? 'debit' : 'credit',
        payment_status: 'Paid',
        order_status: 'Confirmed',
        notes: customerInfo.notes || '',
        gov_id_url: customerInfo.govIdUrl || null,
        payment_attempt_id: attempt.id,
        moneris_ticket: verificationTicket,
        moneris_reference_no: receipt.referenceNumber || null,
        moneris_auth_code: receipt.authorizationCode || null,
        card_brand: receipt.cardType || (customerInfo.paymentMethod === 'debit' ? 'Visa Debit' : 'Visa'),
        card_last4: receipt.lastFourDigits || null,
      },
      items: (attempt.items || []).map((it) => ({
        product_id: it.product_id,
        techpos_product_id: it.techpos_product_id,
        sku: it.sku,
        product_name: it.product_name,
        variant_label: it.variant_label,
        quantity: it.quantity,
        unit_price: it.unit_price,
        image_url: it.image_url,
      })),
    });

    // 9. Mark Payment Attempt Completed
    await PaymentAttemptModel.markCompleted(attempt.id, {
      orderId: createdOrder.id,
      receipt: receipt.rawSafeResponse,
    });

    // 10. Sync Paid Order to TechPOS OpenAPI
    let syncResult = { success: false, message: 'Sync pending' };
    try {
      syncResult = await syncOrderToTechPOS(createdOrder);
      if (syncResult.success) {
        await OrderModel.updateSyncStatus(createdOrder.id, {
          techpos_order_id: syncResult.techpos_order_id,
          sync_status: 'synced',
          sync_error: null,
        });
        createdOrder.sync_status = 'synced';
        createdOrder.techpos_order_id = syncResult.techpos_order_id;
      } else {
        await OrderModel.updateSyncStatus(createdOrder.id, {
          sync_status: 'failed',
          sync_error: syncResult.message,
        });
        createdOrder.sync_status = 'failed';
      }
    } catch (syncErr) {
      console.warn('[TechPOS Sync Warning during Moneris Finalize]', syncErr.message);
    }

    return res.status(200).json({
      success: true,
      approved: true,
      orderCreated: true,
      order: createdOrder,
      sync: syncResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments/moneris/cancel
 * @desc    Mark payment attempt cancelled by user
 * @access  Public
 */
const cancelPayment = async (req, res, next) => {
  try {
    const { paymentAttemptId } = req.body;
    if (!paymentAttemptId) {
      return res.status(400).json({ success: false, message: 'Missing paymentAttemptId.' });
    }

    let attempt = null;
    if (!isNaN(Number(paymentAttemptId))) {
      attempt = await PaymentAttemptModel.findById(Number(paymentAttemptId));
    }
    if (!attempt) {
      attempt = await PaymentAttemptModel.findByAttemptNumber(String(paymentAttemptId));
    }

    if (attempt) {
      await PaymentAttemptModel.markCancelled(attempt.id);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment attempt was cancelled.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/moneris/session/:id
 * @desc    Get session details for payment page recovery
 * @access  Public
 */
const getPaymentSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    let attempt = null;
    if (!isNaN(Number(id))) {
      attempt = await PaymentAttemptModel.findById(Number(id));
    }
    if (!attempt) {
      attempt = await PaymentAttemptModel.findByAttemptNumber(String(id));
    }

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Payment attempt not found.' });
    }

    const config = getMonerisConfig();

    return res.status(200).json({
      success: true,
      paymentAttemptId: attempt.id,
      attemptNumber: attempt.attempt_number,
      ticket: attempt.moneris_ticket,
      amount: (attempt.total_cents / 100).toFixed(2),
      status: attempt.status,
      finalizationStatus: attempt.finalization_status,
      finalized: Boolean(attempt.final_order_id),
      orderId: attempt.final_order_id,
      checkoutMode: config.monerisEnvironment,
      checkoutScriptUrl: config.checkoutScriptUrl,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePaymentAttempt,
  finalizePayment,
  cancelPayment,
  getPaymentSession,
};

