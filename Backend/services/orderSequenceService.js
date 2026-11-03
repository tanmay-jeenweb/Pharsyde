const pool = require('../config/db');

const ORDER_COUNTER_KEY = 'pharsyde_order';
const FALLBACK_START_SEQ = 100000;

/**
 * Atomically increment order sequence counter and return formatted sequence (PHR-100xxx)
 * @returns {Promise<string>} e.g. "PHR-100001"
 */
async function getNextOrderNumber() {
  try {
    // MySQL atomic increment using LAST_INSERT_ID(expr)
    await pool.query(
      `UPDATE order_sequences 
       SET current_val = LAST_INSERT_ID(current_val + 1) 
       WHERE sequence_name = ?`,
      [ORDER_COUNTER_KEY]
    );

    const [rows] = await pool.query('SELECT LAST_INSERT_ID() AS next_seq');
    const seq = rows[0]?.next_seq;

    if (seq) {
      return `PHR-${seq}`;
    }
  } catch (err) {
    console.warn('[OrderSequence] Database counter increment failed, checking seed:', err.message);
  }

  // Fallback if not initialized or offline: ensure row exists and retry
  try {
    await pool.query(
      `INSERT INTO order_sequences (sequence_name, current_val)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE current_val = current_val + 1`,
      [ORDER_COUNTER_KEY, FALLBACK_START_SEQ + 1]
    );

    const [rows] = await pool.query(
      'SELECT current_val FROM order_sequences WHERE sequence_name = ?',
      [ORDER_COUNTER_KEY]
    );

    const seq = rows[0]?.current_val || Math.floor(100000 + Math.random() * 900000);
    return `PHR-${seq}`;
  } catch (fallbackErr) {
    console.error('[OrderSequence Critical Error]', fallbackErr.message);
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `PHR-${randomSeq}`;
  }
}

module.exports = {
  getNextOrderNumber,
};

