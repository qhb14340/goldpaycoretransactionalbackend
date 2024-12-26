const crypto = require('crypto');
const pool = require('../config/db');

const createTransaction = async (sender, recipient, weight, fiat_value, fee, transaction_type, metadata) => {
  try {
    const txData = JSON.stringify({ sender, recipient, weight, fiat_value, fee, transaction_type, metadata });
    const id = crypto.createHash('sha256').update(txData).digest('hex');
    const query = `
      INSERT INTO transactions (id, sender, recipient, weight, fiat_value, fee, status, transaction_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [id, sender, recipient, weight, fiat_value, fee, transaction_type, metadata]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Transaction creation failed: ${error.message}`);
  }
};

const getTransactionById = async (transactionId) => {
  try {
    const query = 'SELECT * FROM transactions WHERE id = $1';
    const result = await pool.query(query, [transactionId]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Transaction retrieval failed: ${error.message}`);
  }
};

const confirmTransaction = async (transactionId) => {
  try {
    const query = "UPDATE transactions SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = $1 AND status != 'confirmed' RETURNING *";
    const result = await pool.query(query, [transactionId]);
    if (result.rowCount === 0) {
      throw new Error('Transaction could not be confirmed (it may already be confirmed or does not exist).');
    }
    return result.rows[0];
  } catch (error) {
    throw new Error(`Transaction confirmation failed: ${error.message}`);
  }
};

const getUserTransactions = async (userId) => {
  try {
    const query = 'SELECT * FROM transactions WHERE sender = $1 OR recipient = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    throw new Error(`Fetching user transactions failed: ${error.message}`);
  }
};

module.exports = { createTransaction, getTransactionById, confirmTransaction, getUserTransactions };