const OrderModel = require('../models/orderModel');
const { syncOrderToTechPOS } = require('../services/techposOrderService');

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
      paymentMethod = 'card',
      notes = '',
    } = req.body;

    // Disallow in-store pay / COD
    if (paymentMethod === 'pickup_pay' || paymentMethod === 'cod' || paymentMethod === 'cash') {
      return res.status(400).json({
        success: false,
        message: 'In-store payment and COD have been discontinued. All orders must be prepaid online.',
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

    // Free delivery threshold: $75.00 CAD
    const FREE_SHIPPING_THRESHOLD = 75.0;
    const isPickup = fulfillmentType === 'pickup';
    const shipping = isPickup || subtotal >= FREE_SHIPPING_THRESHOLD ? 0.0 : 9.99;

    // Manitoba Tax (5% GST + 7% PST = 12%)
    const tax = Math.round(subtotal * 0.12 * 100) / 100;
    const total = Math.round((subtotal + tax + shipping) * 100) / 100;

    const orderNumber = generateOrderNumber();

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
        notes,
      },
      items: normalizedItems,
    });

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

