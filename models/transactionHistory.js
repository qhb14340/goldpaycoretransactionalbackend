const pool = require('../config/db');

const createTransactionHistoryEntry = async (transaction_id, sender, recipient, weight, fiat_value, fee, transaction_type, metadata, vault_locs) => {
  try {
    const query = `
      INSERT INTO transaction_history (transaction_id, sender, recipient, weight, fiat_value, fee, transaction_type, metadata, vault_locs)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await pool.query(query, [transaction_id, sender, recipient, weight, fiat_value, fee, transaction_type, metadata, vault_locs]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Transaction history entry creation failed: ${error.message}`);
  }
};

const getUserTransactionHistory = async (user_id) => {
  try {
    const query = 'SELECT * FROM transaction_history WHERE sender = $1 OR recipient = $1 ORDER BY timestamp DESC';
    const result = await pool.query(query, [user_id]);
    return result.rows;
  } catch (error) {
    throw new Error(`Fetching user transaction history failed: ${error.message}`);
  }
};

module.exports = { createTransactionHistoryEntry, getUserTransactionHistory };