const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createPaymentBill = async (merchant_id, amount, description) => {
  const id = uuidv4();
  const query = `
    INSERT INTO payment_bills (id, merchant_id, amount, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await pool.query(query, [id, merchant_id, amount, description]);
  return result.rows[0];
};

const getPaymentBill = async (id) => {
  const query = 'SELECT * FROM payment_bills WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = { createPaymentBill, getPaymentBill };