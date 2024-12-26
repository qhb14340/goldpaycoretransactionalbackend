const logger = require('../utils/logger');

const authenticateUser = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    logger.warn(`Unauthorized access attempt: ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  logger.info(`Authenticated request: ${req.ip}`);
  next();
};

module.exports = { authenticateUser };