const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increase max connections for better performance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Add event listener for errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;