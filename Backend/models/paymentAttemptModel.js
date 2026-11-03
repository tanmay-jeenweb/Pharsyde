const pool = require('../config/db');

const FINALIZATION_LOCK_STALE_MS = 5 * 60 * 1000; // 5 minutes

const PaymentAttemptModel = {
  /**
   * Create a new payment attempt row
   */
  async create(data) {
    const {
      attempt_number,
      user_id = null,
      guest_token_hash = null,
      order_type = 'pickup',
      subtotal_cents = 0,
      gst_cents = 0,
      pst_cents = 0,
      tax_cents = 0,
      shipping_cents = 0,
      total_cents = 0,
      currency = 'CAD',
      items = [],
      customer_info = {},
      shipping_address = null,
      merchant_order_number,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO payment_attempts (
        attempt_number, user_id, guest_token_hash, status, finalization_status,
        order_type, subtotal_cents, gst_cents, pst_cents, tax_cents,
        shipping_cents, total_cents, currency,
        items_json, customer_info_json, shipping_address_json,
        merchant_order_number
      ) VALUES (?, ?, ?, 'created', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attempt_number,
        user_id || null,
        guest_token_hash || null,
        order_type,
        subtotal_cents,
        gst_cents,
        pst_cents,
        tax_cents,
        shipping_cents,
        total_cents,
        currency,
        JSON.stringify(items),
        JSON.stringify(customer_info),
        shipping_address ? JSON.stringify(shipping_address) : null,
        merchant_order_number,
      ]
    );

    return this.findById(result.insertId);
  },

  /**
   * Find attempt by numeric ID
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM payment_attempts WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return this.normalizeRow(rows[0]);
  },

  /**
   * Find attempt by attempt_number or merchant_order_number
   */
  async findByAttemptNumber(attemptNumber) {
    const [rows] = await pool.query(
      'SELECT * FROM payment_attempts WHERE attempt_number = ? OR merchant_order_number = ?',
      [attemptNumber, attemptNumber]
    );
    if (rows.length === 0) return null;
    return this.normalizeRow(rows[0]);
  },

  /**
   * Update attempt with Moneris preload ticket
   */
  async updatePreloadTicket(id, ticket, safeResponse = null) {
    await pool.query(
      `UPDATE payment_attempts 
       SET moneris_ticket = ?, status = 'preloaded', moneris_response = ?
       WHERE id = ?`,
      [ticket, safeResponse ? JSON.stringify(safeResponse) : null, id]
    );
  },

  /**
   * Acquire atomic finalization lock on a payment attempt
   * Returns true if lock was acquired, false if another process is currently running
   */
  async acquireFinalizationLock(id) {
    const staleTime = new Date(Date.now() - FINALIZATION_LOCK_STALE_MS);

    // Conditional atomic update
    const [result] = await pool.query(
      `UPDATE payment_attempts 
       SET finalization_status = 'processing', finalization_error = NULL
       WHERE id = ? 
         AND final_order_id IS NULL
         AND (
           finalization_status IN ('pending', 'failed')
           OR (finalization_status = 'processing' AND updated_at < ?)
         )`,
      [id, staleTime]
    );

    return result.affectedRows > 0;
  },

  /**
   * Mark attempt completed with final order ID and Moneris receipt
   */
  async markCompleted(id, { orderId, receipt = null }) {
    await pool.query(
      `UPDATE payment_attempts 
       SET status = 'approved',
           finalization_status = 'completed',
           final_order_id = ?,
           moneris_response = COALESCE(?, moneris_response),
           finalized_at = CURRENT_TIMESTAMP,
           verified_at = CURRENT_TIMESTAMP,
           finalization_error = NULL
       WHERE id = ?`,
      [orderId, receipt ? JSON.stringify(receipt) : null, id]
    );
  },

  /**
   * Mark attempt finalization failed
   */
  async markFinalizationFailed(id, errorMessage, updates = {}) {
    const fields = ['finalization_status = "failed"', 'finalization_error = ?'];
    const params = [errorMessage];

    if (updates.status) {
      fields.push('status = ?');
      params.push(updates.status);
    }
    if (updates.failure_reason) {
      fields.push('failure_reason = ?');
      params.push(updates.failure_reason);
    }
    if (updates.moneris_response) {
      fields.push('moneris_response = ?');
      params.push(JSON.stringify(updates.moneris_response));
    }

    params.push(id);
    await pool.query(`UPDATE payment_attempts SET ${fields.join(', ')} WHERE id = ?`, params);
  },

  /**
   * Mark attempt cancelled by user
   */
  async markCancelled(id) {
    await pool.query(
      `UPDATE payment_attempts 
       SET status = 'cancelled', failure_reason = 'Cancelled by user'
       WHERE id = ? AND final_order_id IS NULL`,
      [id]
    );
  },

  /**
   * Normalize JSON columns
   */
  normalizeRow(row) {
    if (!row) return null;
    return {
      ...row,
      items: typeof row.items_json === 'string' ? JSON.parse(row.items_json || '[]') : row.items_json || [],
      customer_info: typeof row.customer_info_json === 'string' ? JSON.parse(row.customer_info_json || '{}') : row.customer_info_json || {},
      shipping_address: typeof row.shipping_address_json === 'string' ? JSON.parse(row.shipping_address_json || '{}') : row.shipping_address_json || null,
      moneris_response: typeof row.moneris_response === 'string' ? JSON.parse(row.moneris_response || '{}') : row.moneris_response || null,
    };
  },
};

module.exports = PaymentAttemptModel;

