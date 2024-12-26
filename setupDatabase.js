const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utxos (
        id UUID PRIMARY KEY,
        weight NUMERIC NOT NULL,
        fiat_val NUMERIC NOT NULL,
        vault_loc VARCHAR(255) NOT NULL,
        owner VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'unspent',
        transaction_id UUID NOT NULL,
        transaction_type VARCHAR(20) NOT NULL,
        acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acquisition_fiat_val NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        spent_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY,
        sender VARCHAR(255),
        recipient VARCHAR(255),
        weight NUMERIC NOT NULL,
        fiat_value NUMERIC NOT NULL,
        fee NUMERIC,
        status VARCHAR(50) DEFAULT 'pending',
        transaction_type VARCHAR(50) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS utxo_history (
        id SERIAL PRIMARY KEY,
        utxo_id UUID REFERENCES utxos(id),
        previous_owner VARCHAR(255),
        new_owner VARCHAR(255),
        fiat_value_at_transfer NUMERIC NOT NULL,
        weight_transferred NUMERIC NOT NULL,
        is_change BOOLEAN DEFAULT FALSE,
        original_utxo_id UUID,
        vault_loc VARCHAR(255) NOT NULL,
        transfer_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transaction_history (
        id SERIAL PRIMARY KEY,
        transaction_id UUID REFERENCES transactions(id),
        sender VARCHAR(255),
        recipient VARCHAR(255),
        weight NUMERIC NOT NULL,
        fiat_value NUMERIC NOT NULL,
        fee NUMERIC,
        transaction_type VARCHAR(50) NOT NULL,
        metadata JSONB,
        vault_locs TEXT[],
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fees (
        id SERIAL PRIMARY KEY,
        transaction_type VARCHAR(50) UNIQUE NOT NULL,
        fee_percentage NUMERIC NOT NULL
      );

      CREATE TABLE IF NOT EXISTS payment_bills (
        id UUID PRIMARY KEY,
        merchant_id VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS p2p_concepts (
        id UUID PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        concept TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_utxos_owner ON utxos(owner);
      CREATE INDEX IF NOT EXISTS idx_utxos_status ON utxos(status);
      CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender);
      CREATE INDEX IF NOT EXISTS idx_transactions_recipient ON transactions(recipient);
      CREATE INDEX IF NOT EXISTS idx_utxo_history_utxo_id ON utxo_history(utxo_id);
      CREATE INDEX IF NOT EXISTS idx_transaction_history_transaction_id ON transaction_history(transaction_id);
    `);

    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables', err);
  } finally {
    pool.end();
  }
};

createTables();