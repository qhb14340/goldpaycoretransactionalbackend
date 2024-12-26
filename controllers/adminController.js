const { setTransactionFee, getTransactionFee } = require('../models/fee');

const setFees = async (req, res) => {
  try {
    const { transaction_type, fee_percentage } = req.body;
    if (!transaction_type || fee_percentage === undefined) {
      return res.status(400).json({ status: 'failed', error: 'Missing required fields' });
    }
    const updatedFee = await setTransactionFee(transaction_type, fee_percentage);
    res.json({ status: 'success', updatedFee });
  } catch (error) {
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

const getFees = async (req, res) => {
  try {
    const { transaction_type } = req.params;
    const fee = await getTransactionFee(transaction_type);
    if (!fee) {
      return res.status(404).json({ status: 'failed', error: 'Fee not found for this transaction type' });
    }
    res.json({ status: 'success', fee });
  } catch (error) {
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

module.exports = { setFees, getFees };