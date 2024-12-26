const { getUserUtxos, getUtxoById } = require('../models/utxo');
const { getUtxoHistory } = require('../models/utxoHistory');

const getUserUtxosHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const utxos = await getUserUtxos(userId);
    res.json({ status: 'success', utxos });
  } catch (error) {
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

const getUtxoDetailsHandler = async (req, res) => {
  try {
    const { utxoId } = req.params;
    const utxo = await getUtxoById(utxoId);
    if (!utxo) {
      return res.status(404).json({ status: 'failed', error: 'UTXO not found' });
    }
    const history = await getUtxoHistory(utxoId);
    res.json({ status: 'success', utxo, history });
  } catch (error) {
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

module.exports = { getUserUtxosHandler, getUtxoDetailsHandler };