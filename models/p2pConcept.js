const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createP2PConcept = async (sender_id, concept) => {
  const id = uuidv4();
  const query = `
    INSERT INTO p2p_concepts (id, sender_id, concept)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(query, [id, sender_id, concept]);
  return result.rows[0];
};

const getP2PConcept = async (id) => {
  const query = 'SELECT * FROM p2p_concepts WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

module.exports = { createP2PConcept, getP2PConcept };