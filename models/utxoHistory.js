const pool = require('../config/db');

const createUtxoHistoryEntry = async (utxo_id, previous_owner, new_owner, fiat_value_at_transfer, weight_transferred, is_change = false, original_utxo_id = null, vault_loc) => {
  try {
    const query = `
      INSERT INTO utxo_history (utxo_id, previous_owner, new_owner, fiat_value_at_transfer, weight_transferred, is_change, original_utxo_id, vault_loc)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [utxo_id, previous_owner, new_owner, fiat_value_at_transfer, weight_transferred, is_change, original_utxo_id, vault_loc]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`UTXO history entry creation failed: ${error.message}`);
  }
};

const getUtxoHistory = async (utxo_id) => {
  try {
    const query = 'SELECT * FROM utxo_history WHERE utxo_id = $1 ORDER BY transfer_timestamp ASC';
    const result = await pool.query(query, [utxo_id]);
    return result.rows;
  } catch (error) {
    throw new Error(`Fetching UTXO history failed: ${error.message}`);
  }
};

module.exports = { createUtxoHistoryEntry, getUtxoHistory };