const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

// Import routes
const utxoRoutes = require('./routes/utxoRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const contextualDataRoutes = require('./routes/contextualDataRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mintBurnRoutes = require('./routes/mintBurnRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/utxo', utxoRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/contextualData', contextualDataRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mintBurn', mintBurnRoutes);

// Serve a basic homepage for sanity check
app.get('/', (req, res) => {
  res.send('GoldPay Core Backend is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;