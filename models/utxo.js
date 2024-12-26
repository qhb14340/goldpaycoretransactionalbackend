const crypto = require('crypto');
const pool = require('../config/db');

const createUtxo = async (weight, fiat_val, vault_loc, owner, transaction_id, transaction_type, is_change = false, original_acquisition_date = null, original_acquisition_fiat_val = null) => {
  try {
    const utxoData = JSON.stringify({ weight, fiat_val, vault_loc, owner, transaction_id });
    const id = crypto.createHash('sha256').update(utxoData).digest('hex');
    const query = `
      INSERT INTO utxos (id, weight, fiat_val, vault_loc, owner, status, transaction_id,transaction_type, acquired_at, acquisition_fiat_val)
      VALUES ($1, $2, $3, $4, $5, 'unspent', $6, $7, $8)
      RETURNING *
    `;
    const acquired_at = is_change ? original_acquisition_date : 'CURRENT_TIMESTAMP';
    const acquisition_fiat_val = is_change ? original_acquisition_fiat_val : fiat_val;
    const result = await pool.query(query, [id, weight, fiat_val, vault_loc, owner, transaction_id, transaction_type, acquired_at, acquisition_fiat_val]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`UTXO creation failed: ${error.message}`);
  }
};

const getUtxoById = async (id) => {
  try {
    const query = 'SELECT * FROM utxos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Fetching UTXO by ID failed: ${error.message}`);
  }
};

const getUserUtxos = async (owner) => {
  try {
    const query = 'SELECT * FROM utxos WHERE owner = $1 AND status = \'unspent\'';
    const result = await pool.query(query, [owner]);
    return result.rows;
  } catch (error) {
    throw new Error(`Fetching user UTXOs failed: ${error.message}`);
  }
};

const spendUtxo = async (id, current_fiat_val, client) => {
  const query = `
    UPDATE utxos 
    SET status = 'spent', spent_at = CURRENT_TIMESTAMP, fiat_val = $2
    WHERE id = $1 AND status = 'unspent'
    RETURNING *
  `;
  const result = await client.query(query, [id, current_fiat_val]);
  if (result.rowCount === 0) {
    throw new Error('UTXO could not be spent (it may already be spent or does not exist).');
  }
  return result.rows[0];
};

const lockUtxo = async (utxoId, client) => {
  const query = 'SELECT * FROM utxos WHERE id = $1 FOR UPDATE';
  const result = await client.query(query, [utxoId]);
  if (result.rows.length === 0) {
    throw new Error('UTXO not found or already spent');
  }
  return result.rows[0];
};

const mintUtxo = async (weight, fiat_val, vault_loc, owner) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const utxoData = JSON.stringify({ weight, fiat_val, vault_loc, owner });
    const id = crypto.createHash('sha256').update(utxoData).digest('hex');
    const query = `
      INSERT INTO utxos (id, weight, fiat_val, vault_loc, owner, status, transaction_type, acquired_at, acquisition_fiat_val)
      VALUES ($1, $2, $3, $4, $5, 'unspent', 'mint', CURRENT_TIMESTAMP, $6)
      RETURNING *
    `;
    const result = await client.query(query, [id, weight, fiat_val, vault_loc, owner, fiat_val]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`UTXO minting failed: ${error.message}`);
  } finally {
    client.release();
  }
};
const burnUtxo = async (utxoId, current_fiat_val) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const query = `
      UPDATE utxos 
      SET status = 'burned', spent_at = CURRENT_TIMESTAMP, fiat_val = $2, transaction_type = 'burn'
      WHERE id = $1 AND status = 'unspent'
      RETURNING *
    `;
    const result = await client.query(query, [utxoId, current_fiat_val]);
    if (result.rowCount === 0) {
      throw new Error('UTXO could not be burned (it may already be spent or does not exist).');
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(`UTXO burning failed: ${error.message}`);
  } finally {
    client.release();
  }
};

module.exports = { createUtxo, getUtxoById, getUserUtxos, spendUtxo, lockUtxo, mintUtxo, burnUtxo };