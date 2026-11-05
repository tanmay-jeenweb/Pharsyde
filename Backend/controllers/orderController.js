const OrderModel = require('../models/orderModel');
const UserModel = require('../models/userModel');
const SettingModel = require('../models/settingModel');
const OtpModel = require('../models/otpModel');
const pool = require('../config/db');
const { syncOrderToTechPOS } = require('../services/techposOrderService');
const { calculateOrderTaxes } = require('../utils/taxCalculator');
const { validateCannabisLimit } = require('../utils/cannabisLimit');

/**
 * Generate a unique formatted order number (e.g. PHAR-847291)
 */
const generateOrderNumber = () => {
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `PHAR-${randomPart}`;
};

/**
 * @route   POST /api/orders
 * @desc    Create a new customer order and sync with TechPOS
 * @access  Public (Guest or Authenticated Customer)
 */
const createOrder = async (req, res, next) => {
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

    // Disallow in-store pay / COD / Interac e-Transfer
    if (paymentMethod === 'interac' || paymentMethod === 'pickup_pay' || paymentMethod === 'cod' || paymentMethod === 'cash') {
      return res.status(400).json({
        success: false,
        message: 'Interac e-Transfer and cash on delivery are not supported. All orders must be prepaid online via credit or debit card.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required and cart cannot be empty.',
      });
    }

    // Customer details resolution (from body or authenticated user)
    const authUser = req.user || null;
    const customerFirstName = customer.firstName || (authUser?.name ? authUser.name.split(' ')[0] : 'Valued');
    const customerLastName = customer.lastName || (authUser?.name ? authUser.name.split(' ').slice(1).join(' ') : 'Customer');
    const customerName = `${customerFirstName} ${customerLastName}`.trim();
    const customerEmail = customer.email || authUser?.email;
    const customerPhone = customer.phone || authUser?.mob_no || '';

    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Customer email address is required.',
      });
    }

    // If guest checkout, verify email does not belong to an existing registered user and is OTP verified
    let guestVerificationToken = null;
    if (!authUser && customerEmail) {
      const cleanEmail = customerEmail.trim().toLowerCase();
      const existingUser = await UserModel.findByEmail(cleanEmail);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          code: 'ACCOUNT_EXISTS',
          message: 'An account with this email already exists. Please log in to complete your order.',
        });
      }

      guestVerificationToken = req.body.verificationToken || req.body.verification_token || customer.verificationToken || customer.verification_token;
      const isTokenValid = await OtpModel.validateVerificationToken({
        email: cleanEmail,
        purpose: 'guest_checkout',
        verificationToken: guestVerificationToken,
      });

      if (!isTokenValid) {
        return res.status(400).json({
          success: false,
          code: 'EMAIL_VERIFICATION_REQUIRED',
          message: 'Email verification is required for guest checkout. Please verify your email with the 6-digit code.',
        });
      }
    }

    // Check if Government ID upload is mandatory
    const isGovIdMandatory = (await SettingModel.getValue('gov_id_mandatory', 'false')) === 'true';
    const uploadedIdUrl = customer.govIdUrl || customer.gov_id_url || gov_id_url || req.body.govIdUrl || null;
    if (isGovIdMandatory && !uploadedIdUrl) {
      return res.status(400).json({
        success: false,
        code: 'GOV_ID_REQUIRED',
        message: 'A valid government-approved ID document is required to complete your order.',
      });
    }

    // Validate delivery address if courier delivery
    if (fulfillmentType === 'delivery') {
      const deliveryStreet = address || customer.address;
      const deliveryPostal = postalCode || customer.postalCode;
      if (!deliveryStreet || !deliveryPostal) {
        return res.status(400).json({
          success: false,
          message: 'Delivery address and postal code are required for courier orders.',
        });
      }
    }

    // Calculate subtotal from validated item units
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.unit_price || item.price || item.variant?.price || 0);
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0);

    // Free delivery threshold (Configured in Setting Master)
    const configuredThresholdStr = await SettingModel.getValue('free_delivery_threshold', '75.0');
    const FREE_SHIPPING_THRESHOLD = parseFloat(configuredThresholdStr) || 75.0;
    const isPickup = fulfillmentType === 'pickup';
    const shipping = isPickup || subtotal >= FREE_SHIPPING_THRESHOLD ? 0.0 : 9.99;

    // Reward points redemption logic
    let pointsDiscount = 0.00;
    let pointsRedeemed = 0;
    const { redeem_rewards, redeemed_points } = req.body;

    if (authUser && (redeem_rewards || Number(redeemed_points) > 0)) {
      const dbUser = await UserModel.findById(authUser.id);
      const userPoints = Number(dbUser?.reward_points || 0);

      if (userPoints > 0) {
        // Calculate point conversion: default 1 pt = $1.00 (or ratio from TechPOS dollar value)
        const dollarRate = (Number(dbUser.reward_points_dollar_value) > 0 && userPoints > 0)
          ? (Number(dbUser.reward_points_dollar_value) / userPoints)
          : 1.00;

        const maxPoints = Math.min(userPoints, Math.floor(subtotal / dollarRate));
        pointsRedeemed = redeemed_points ? Math.min(Number(redeemed_points), maxPoints) : maxPoints;
        pointsDiscount = Math.round(pointsRedeemed * dollarRate * 100) / 100;

        // Deduct points immediately to lock against re-use
        if (pointsRedeemed > 0) {
          await UserModel.deductRewardPoints(authUser.id, pointsRedeemed);
          console.log(`[Order Rewards] Customer ID ${authUser.id} redeemed ${pointsRedeemed} reward points (-$${pointsDiscount.toFixed(2)} CAD).`);
        }
      }
    }

    // Resolve product categories from DB if missing on incoming items
    const missingProductIds = items
      .filter((i) => !i.category && !i.product?.category)
      .map((i) => i.product_id || i.productId || i.pk || i.id)
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
        console.warn('[Order Tax] DB category lookup warning:', catErr.message);
      }
    }

    const itemsForTax = items.map((i) => {
      const pid = String(i.product_id || i.productId || i.pk || i.id || '');
      return {
        ...i,
        category: i.category || i.product?.category || categoryMap[pid]?.category || '',
        equivalent_g: i.equivalent_g ?? i.product?.equivalent_g ?? categoryMap[pid]?.equivalent_g,
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

    // Dynamic tax calculation: 5% Cannabis, 7% Nicotine (proportionally discounted)
    const taxSummary = calculateOrderTaxes(itemsForTax, {
      discount: pointsDiscount,
      shipping,
    });
    const tax = taxSummary.tax;
    const total = taxSummary.total;

    const orderNumber = generateOrderNumber();

    const resolvedNotes = [
      notes,
      pointsRedeemed > 0 ? `Redeemed ${pointsRedeemed} TechPOS loyalty points (-$${pointsDiscount.toFixed(2)} CAD discount)` : null,
    ].filter(Boolean).join(' | ');

    // Prepare normalized items list
    const normalizedItems = items.map((item) => ({
      product_id: item.product_id || item.productId || item.pk || item.id || null,
      techpos_product_id: item.techpos_product_id || item.techPosProductId || null,
      sku: item.sku || null,
      product_name: item.product_name || item.name || item.product?.name || 'Cannabis Product',
      variant_label: item.variant_label || item.variant?.label || 'Standard',
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price || item.price || item.variant?.price || 0),
      image_url: item.image_url || item.image || item.imageUrl || item.product?.image || null,
    }));

    // Save order in database
    const createdOrder = await OrderModel.createOrder({
      orderData: {
        order_number: orderNumber,
        user_id: authUser ? authUser.id : null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        fulfillment_type: fulfillmentType,
        address: address || customer.address || '',
        city: city || customer.city || 'Winnipeg',
        postal_code: postalCode || customer.postalCode || '',
        subtotal,
        tax,
        shipping,
        total,
        payment_method: paymentMethod || 'card',
        payment_status: 'Paid',
        order_status: 'Confirmed',
        notes: resolvedNotes,
        gov_id_url: customer.govIdUrl || customer.gov_id_url || gov_id_url || req.body.govIdUrl || null,
      },
      items: normalizedItems,
    });

    // Attach techpos_member_id if customer is logged in
    createdOrder.techpos_member_id = authUser?.techpos_member_id || null;

    // Attempt live dispatch to TechPOS OpenAPI
    let syncResult = { success: false, message: 'Sync not attempted' };
    try {
      syncResult = await syncOrderToTechPOS(createdOrder);
      if (syncResult.success) {
        await OrderModel.updateSyncStatus(createdOrder.id, {
          techpos_order_id: syncResult.techpos_order_id,
          sync_status: 'synced',
          sync_error: null,
        });
        createdOrder.techpos_order_id = syncResult.techpos_order_id;
        createdOrder.sync_status = 'synced';
      } else {
        await OrderModel.updateSyncStatus(createdOrder.id, {
          sync_status: 'failed',
          sync_error: syncResult.message,
        });
        createdOrder.sync_status = 'failed';
      }
    } catch (syncErr) {
      console.warn('[TechPOS Sync Non-blocking Error]', syncErr.message);
    }

    if (guestVerificationToken) {
      await OtpModel.consumeVerificationToken(guestVerificationToken);
    }

    res.status(201).json({
      success: true,
      message: `Order #${orderNumber} placed successfully!`,
      order: createdOrder,
      sync: syncResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders
 * @desc    Get order history for the authenticated customer
 * @access  Private (Strictly requires Customer Login - matches zip implementation)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const authUser = req.user || null;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Please login to view your orders.',
      });
    }

    const orders = await OrderModel.findByUser({
      userId: authUser.id,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by order number or ID
 * @access  Public / Protected
 */
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/orders/:id/sync-techpos
 * @desc    Manually re-sync an order with TechPOS
 * @access  Protected
 */
const retryTechPosSync = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${id} not found`,
      });
    }

    const syncResult = await syncOrderToTechPOS(order);
    if (syncResult.success) {
      await OrderModel.updateSyncStatus(order.id, {
        techpos_order_id: syncResult.techpos_order_id,
        sync_status: 'synced',
        sync_error: null,
      });
    } else {
      await OrderModel.updateSyncStatus(order.id, {
        sync_status: 'failed',
        sync_error: syncResult.message,
      });
    }

    res.status(200).json({
      success: syncResult.success,
      sync: syncResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/office/all
 * @desc    Admin / Office portal endpoint to view all orders
 * @access  Protected
 */
const getOfficeOrders = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, status = '' } = req.query;
    const data = await OrderModel.getAllOrders({ limit, offset, status });

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  retryTechPosSync,
  getOfficeOrders,
};

