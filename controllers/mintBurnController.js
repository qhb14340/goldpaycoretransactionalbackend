const { mintUtxo, burnUtxo } = require('../models/utxo');
const { createTransaction } = require('../models/transaction');
const logger = require('../utils/logger');

const mintGold = async (req, res) => {
  const { userId, weight, fiat_value, vault_loc } = req.body;
  try {
    const newUtxo = await mintUtxo(weight, fiat_value, vault_loc, userId, null, 'mint');
    await createTransaction(null, userId, weight, fiat_value, 0, 'mint', {});
    logger.info(`Gold minted: ${weight} for user ${userId}`);
    res.json({ status: 'success', utxo: newUtxo });
  } catch (error) {
    logger.error(`Mint operation failed: ${error.message}`);
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

const burnGold = async (req, res) => {
  const { userId, utxoId, current_fiat_value } = req.body;
  try {
    const burnedUtxo = await burnUtxo(utxoId, current_fiat_value, 'burn');
    if (burnedUtxo.owner !== userId) {
      throw new Error('UTXO does not belong to the user');
    }
    await createTransaction(userId, null, burnedUtxo.weight, current_fiat_value, 0, 'burn', {});
    logger.info(`Gold burned: ${burnedUtxo.weight} for user ${userId}`);
    res.json({ status: 'success', burnedUtxo });
  } catch (error) {
    logger.error(`Burn operation failed: ${error.message}`);
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

module.exports = { mintGold, burnGold };