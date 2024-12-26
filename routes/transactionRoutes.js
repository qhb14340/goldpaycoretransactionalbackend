const express = require('express');
const { body, validationResult } = require('express-validator');
const { initiateTransaction, getTransactionStatus, getUserTransactionHistory } = require('../controllers/transactionController');
const logger = require('../utils/logger');

const router = express.Router();

const validateTransaction = [
  body('sender').notEmpty().isString(),
  body('recipient').notEmpty().isString(),
  body('weight').isNumeric(),
  body('fiat_value').isNumeric(),
  body('transaction_type').isIn(['payment', 'p2p']),
  body('contextual_data').notEmpty(),
];

router.post('/initiate', validateTransaction, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Invalid transaction request: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}, initiateTransaction);

router.get('/status/:transactionId', getTransactionStatus);
router.get('/history/:userId', getUserTransactionHistory);

module.exports = router;