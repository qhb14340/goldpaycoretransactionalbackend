const pool = require('../config/db');

const setTransactionFee = async (transaction_type, fee_percentage) => {
  try {
    const query = `
      INSERT INTO fees (transaction_type, fee_percentage)
      VALUES ($1, $2)
      ON CONFLICT (transaction_type) DO UPDATE
      SET fee_percentage = EXCLUDED.fee_percentage
      RETURNING *
    `;
    const result = await pool.query(query, [transaction_type, fee_percentage]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Setting transaction fee failed: ${error.message}`);
  }
};

const getTransactionFee = async (transaction_type) => {
  try {
    const query = 'SELECT * FROM fees WHERE transaction_type = $1';
    const result = await pool.query(query, [transaction_type]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Fetching transaction fee failed: ${error.message}`);
  }
};

module.exports = { setTransactionFee, getTransactionFee };