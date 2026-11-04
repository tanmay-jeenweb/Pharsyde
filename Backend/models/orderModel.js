const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// Fallback JSON storage if MySQL is disconnected during local development
const FALLBACK_FILE = path.resolve(__dirname, '../data/fallback_orders.json');

const getFallbackOrders = () => {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[OrderModel Fallback Read Error]', err.message);
  }
  return [];
};

const saveFallbackOrders = (orders) => {
  try {
    const dir = path.dirname(FALLBACK_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (err) {
    console.error('[OrderModel Fallback Write Error]', err.message);
  }
};

const ORDER_TABLES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NULL,
    fulfillment_type ENUM('pickup', 'delivery') DEFAULT 'pickup',
    address TEXT NULL,
    city VARCHAR(100) DEFAULT 'Winnipeg',
    postal_code VARCHAR(30) NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'interac',
    payment_status VARCHAR(50) DEFAULT 'Pending',
    order_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT NULL,
    gov_id_url VARCHAR(500) NULL,
    techpos_order_id VARCHAR(100) NULL,
    techpos_external_identifier VARCHAR(100) NULL,
    sync_status VARCHAR(50) DEFAULT 'pending',
    sync_error TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_user (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_order_email (customer_email)
  );
`;

const ORDER_ITEMS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id VARCHAR(50) NULL,
    techpos_product_id INT NULL,
    sku VARCHAR(100) NULL,
    product_name VARCHAR(255) NOT NULL,
    variant_label VARCHAR(100) NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_item_order_id (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`;

const OrderModel = {
  /**
   * Initialize tables in MySQL
   */
  async createTable() {
    try {
      await pool.query(ORDER_TABLES_SCHEMA);
      await pool.query(ORDER_ITEMS_TABLE_SCHEMA);
      try { await require('../scripts/migratePaymentTables')(); } catch (mErr) { console.warn('[Migration Warning]', mErr.message); }
      try { await require('../scripts/migrateGovIdColumn')(); } catch (gErr) { console.warn('[Gov ID Migration Warning]', gErr.message); }
      console.log('[OrderModel] Orders & Order Items tables verified/created successfully.');
    } catch (err) {
      console.warn('[OrderModel Warning] Could not create orders table in MySQL:', err.message);
    }
  },

  /**
   * Create a new order with items
   */
  async createOrder({ orderData, items }) {
    const {
      order_number,
      user_id = null,
      customer_name,
      customer_email,
      customer_phone = '',
      fulfillment_type = 'pickup',
      address = '',
      city = 'Winnipeg',
      postal_code = '',
      subtotal = 0,
      tax = 0,
      shipping = 0,
      total = 0,
      payment_method = 'interac',
      payment_status = 'Pending',
      order_status = 'Pending',
      notes = '',
      gov_id_url = null,
      payment_attempt_id = null,
      moneris_ticket = null,
      moneris_reference_no = null,
      moneris_auth_code = null,
      card_brand = null,
      card_last4 = null,
    } = orderData;

    try {
      // 1. Insert into orders table
      const [result] = await pool.query(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          fulfillment_type, address, city, postal_code,
          subtotal, tax, shipping, total,
          payment_method, payment_status, order_status, notes, gov_id_url, sync_status, payment_attempt_id, moneris_ticket, moneris_reference_no, moneris_auth_code, card_brand, card_last4
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
        [
          order_number,
          user_id || null,
          customer_name,
          customer_email,
          customer_phone,
          fulfillment_type,
          address,
          city,
          postal_code,
          subtotal,
          tax,
          shipping,
          total,
          payment_method,
          payment_status,
          order_status,
          notes,
          gov_id_url || null,
          payment_attempt_id || null,
          moneris_ticket || null,
          moneris_reference_no || null,
          moneris_auth_code || null,
          card_brand || null,
          card_last4 || null,
        ]
      );

      const orderId = result.insertId;

      // 2. Insert order items
      if (Array.isArray(items) && items.length > 0) {
        const itemValues = items.map((item) => [
          orderId,
          item.product_id || item.productId || item.pk || null,
          item.techpos_product_id || item.techPosProductId || null,
          item.sku || null,
          item.product_name || item.name || 'Cannabis Product',
          item.variant_label || item.variant?.label || 'Standard',
          item.quantity || 1,
          item.unit_price || item.price || 0,
          (item.unit_price || item.price || 0) * (item.quantity || 1),
          item.image_url || item.image || item.imageUrl || null,
        ]);

        await pool.query(
          `INSERT INTO order_items (
            order_id, product_id, techpos_product_id, sku,
            product_name, variant_label, quantity, unit_price, line_total, image_url
          ) VALUES ?`,
          [itemValues]
        );

        // 3. Instant local stock decrement in MySQL products table
        for (const item of items) {
          const qty = Number(item.quantity) || 1;
          const productId = item.product_id || item.productId || item.pk || null;
          const techPosId = item.techpos_product_id || item.techPosProductId || null;
          const sku = item.sku || null;

          try {
            if (productId) {
              await pool.query(
                `UPDATE products 
                 SET qty_available = GREATEST(0, COALESCE(qty_available, 0) - ?) 
                 WHERE pk = ?`,
                [qty, String(productId)]
              );
            } else if (sku) {
              await pool.query(
                `UPDATE products 
                 SET qty_available = GREATEST(0, COALESCE(qty_available, 0) - ?) 
                 WHERE sku = ?`,
                [qty, String(sku)]
              );
            } else if (techPosId) {
              await pool.query(
                `UPDATE products 
                 SET qty_available = GREATEST(0, COALESCE(qty_available, 0) - ?) 
                 WHERE pk = ?`,
                [qty, String(techPosId)]
              );
            }
          } catch (stockErr) {
            console.warn(`[Stock Decrement Warning] Could not decrement product ${productId || sku}:`, stockErr.message);
          }
        }
      }

      return await this.findById(orderId);
    } catch (dbError) {
      console.warn('[OrderModel DB Error] MySQL failed, saving to local fallback storage:', dbError.message);

      // Fallback JSON persistence
      const orders = getFallbackOrders();
      const newOrder = {
        id: Date.now(),
        order_number,
        user_id: user_id || null,
        customer_name,
        customer_email,
        customer_phone,
        fulfillment_type,
        address,
        city,
        postal_code,
        subtotal: Number(subtotal),
        tax: Number(tax),
        shipping: Number(shipping),
        total: Number(total),
        payment_method,
        payment_status,
        order_status,
        notes,
        techpos_order_id: null,
        sync_status: 'pending',
        sync_error: null,
        created_at: new Date().toISOString(),
        items: items.map((item, idx) => ({
          id: idx + 1,
          product_id: item.product_id || item.productId || item.pk || null,
          techpos_product_id: item.techpos_product_id || item.techPosProductId || null,
          sku: item.sku || null,
          product_name: item.product_name || item.name || 'Cannabis Product',
          variant_label: item.variant_label || item.variant?.label || 'Standard',
          quantity: item.quantity || 1,
          unit_price: Number(item.unit_price || item.price || 0),
          line_total: Number((item.unit_price || item.price || 0) * (item.quantity || 1)),
          image_url: item.image_url || item.image || item.imageUrl || null,
        })),
      };

      orders.unshift(newOrder);
      saveFallbackOrders(orders);
      return newOrder;
    }
  },

  /**
   * Find order by numeric ID or order_number
   */
  async findById(identifier) {
    try {
      const isNum = !isNaN(identifier) && String(identifier).indexOf('PHAR-') === -1;
      const query = isNum ? 'SELECT * FROM orders WHERE id = ?' : 'SELECT * FROM orders WHERE order_number = ?';
      const [orderRows] = await pool.query(query, [identifier]);

      if (orderRows.length === 0) return null;
      const order = orderRows[0];

      const [itemRows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = itemRows;
      return order;
    } catch {
      const orders = getFallbackOrders();
      const match = orders.find(
        (o) => String(o.id) === String(identifier) || String(o.order_number) === String(identifier)
      );
      return match || null;
    }
  },

  /**
   * Find all orders belonging to an authenticated customer strictly by user_id (Option 1: Exact Zip Behavior)
   */
  async findByUser({ userId = null }) {
    if (!userId) {
      return [];
    }

    try {
      const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
      const [orders] = await pool.query(query, [userId]);

      // Attach items for each order
      for (const order of orders) {
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }

      return orders;
    } catch {
      const fallback = getFallbackOrders();
      return fallback.filter(
        (o) => userId && String(o.user_id) === String(userId)
      );
    }
  },

  /**
   * Update TechPOS synchronization status
   */
  async updateSyncStatus(orderId, { techpos_order_id = null, sync_status = 'synced', sync_error = null }) {
    try {
      const isNum = !isNaN(orderId) && String(orderId).indexOf('PHAR-') === -1;
      const query = isNum
        ? `UPDATE orders SET techpos_order_id = COALESCE(?, techpos_order_id), sync_status = ?, sync_error = ? WHERE id = ?`
        : `UPDATE orders SET techpos_order_id = COALESCE(?, techpos_order_id), sync_status = ?, sync_error = ? WHERE order_number = ?`;

      await pool.query(query, [techpos_order_id, sync_status, sync_error, orderId]);
    } catch (err) {
      console.warn('[OrderModel Error] updateSyncStatus MySQL error:', err.message);
      const orders = getFallbackOrders();
      const order = orders.find((o) => String(o.id) === String(orderId) || o.order_number === orderId);
      if (order) {
        if (techpos_order_id) order.techpos_order_id = techpos_order_id;
        order.sync_status = sync_status;
        order.sync_error = sync_error;
        saveFallbackOrders(orders);
      }
    }
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      const isNum = !isNaN(orderId) && String(orderId).indexOf('PHAR-') === -1;
      const query = isNum
        ? 'UPDATE orders SET payment_status = ? WHERE id = ?'
        : 'UPDATE orders SET payment_status = ? WHERE order_number = ?';

      await pool.query(query, [paymentStatus, orderId]);
    } catch (err) {
      console.warn('[OrderModel Error] updatePaymentStatus MySQL error:', err.message);
      const orders = getFallbackOrders();
      const order = orders.find((o) => String(o.id) === String(orderId) || o.order_number === orderId);
      if (order) {
        order.payment_status = paymentStatus;
        saveFallbackOrders(orders);
      }
    }
  },

  /**
   * Get all orders with pagination (for Office / Admin view)
   */
  async getAllOrders({ limit = 50, offset = 0, status = '' } = {}) {
    try {
      let query = 'SELECT * FROM orders';
      const params = [];

      if (status) {
        query += ' WHERE order_status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const [orders] = await pool.query(query, params);

      for (const order of orders) {
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }

      const [countRows] = await pool.query('SELECT COUNT(*) as total FROM orders');
      return { orders, total: countRows[0].total };
    } catch {
      const orders = getFallbackOrders();
      return { orders: orders.slice(offset, offset + limit), total: orders.length };
    }
  },
};

module.exports = OrderModel;

