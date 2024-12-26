const pool = require('../config/db');

const createContextualData = async (ref_id, type, content) => {
  try {
    const query = `
      INSERT INTO contextual_data (ref_id, type, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [ref_id, type, content]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Contextual data creation failed: ${error.message}`);
  }
};

const getContextualDataById = async (ref_id) => {
  try {
    const query = 'SELECT * FROM contextual_data WHERE ref_id = $1';
    const result = await pool.query(query, [ref_id]);
    return result.rows;
  } catch (error) {
    throw new Error(`Fetching contextual data failed: ${error.message}`);
  }
};

module.exports = { createContextualData, getContextualDataById };