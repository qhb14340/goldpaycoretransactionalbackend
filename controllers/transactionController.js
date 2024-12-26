const { createTransaction, getTransactionById, confirmTransaction, getUserTransactions } = require('../models/transaction');
const { getUserUtxos, spendUtxo, createUtxo, lockUtxo } = require('../models/utxo');
const { getTransactionFee } = require('../models/fee');
const { createUtxoHistoryEntry } = require('../models/utxoHistory');
const { createTransactionHistoryEntry } = require('../models/transactionHistory');
const { createPaymentBill } = require('../models/paymentBill');
const { createP2PConcept } = require('../models/p2pConcept');
const pool = require('../config/db');
const logger = require('../utils/logger');

const initiateTransaction = async (req, res) => {
  const { sender, recipient, weight, fiat_value, transaction_type, contextual_data } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (!sender || !recipient || !weight || !fiat_value || !transaction_type) {
      throw new Error('Missing required transaction fields');
    }

    const feeInfo = await getTransactionFee(transaction_type);
    if (!feeInfo) {
      throw new Error('Invalid transaction type');
    }
    const fee = (feeInfo.fee_percentage * fiat_value) / 100;

    let contextualDataId;
    if (transaction_type === 'payment') {
      const { merchant_id, amount, description } = contextual_data;
      const paymentBill = await createPaymentBill(merchant_id, amount, description);
      contextualDataId = paymentBill.id;
    } else if (transaction_type === 'p2p') {
      const { concept } = contextual_data;
      const p2pConcept = await createP2PConcept(sender, concept);
      contextualDataId = p2pConcept.id;
    }

    const metadata = { contextual_data_id: contextualDataId };

    const transaction = await createTransaction(sender, recipient, weight, fiat_value, fee, transaction_type, metadata);

    const senderUtxos = await getUserUtxos(sender);
    let remainingWeight = weight;
    let spentUtxos = [];
    let totalSpentFiatValue = 0;

    const utxosByVault = senderUtxos.reduce((acc, utxo) => {
      if (!acc[utxo.vault_loc]) {
        acc[utxo.vault_loc] = [];
      }
      acc[utxo.vault_loc].push(utxo);
      return acc;
    }, {});

    const outputUtxos = [];
    const involvedVaultLocs = new Set();

    for (const [vault_loc, utxos] of Object.entries(utxosByVault)) {
      let vaultRemainingWeight = remainingWeight;
      for (const utxo of utxos) {
        if (vaultRemainingWeight <= 0) break;

        const lockedUtxo = await lockUtxo(utxo.id, client);
        if (lockedUtxo.status !== 'unspent') {
          throw new Error('UTXO has been spent');
        }

        const spentWeight = Math.min(utxo.weight, vaultRemainingWeight);
        const spentFiatValue = (spentWeight / utxo.weight) * utxo.fiat_val;

        const spentUtxo = await spendUtxo(utxo.id, utxo.fiat_val, client);
        spentUtxos.push(spentUtxo);

        await createUtxoHistoryEntry(utxo.id, sender, recipient, spentFiatValue, spentWeight, false, null, vault_loc);

        vaultRemainingWeight -= spentWeight;
        remainingWeight -= spentWeight;
        totalSpentFiatValue += spentFiatValue;

        if (spentWeight > 0) {
          const recipientUtxo = await createUtxo(
            spentWeight,
            spentFiatValue - (fee * spentWeight / weight),
            vault_loc,
            recipient,
            transaction.id
          );
          outputUtxos.push(recipientUtxo);
          await createUtxoHistoryEntry(recipientUtxo.id, sender, recipient, recipientUtxo.fiat_val, recipientUtxo.weight, false, null, vault_loc);
          involvedVaultLocs.add(vault_loc);
        }

        const changeWeight = utxo.weight - spentWeight;
        if (changeWeight > 0) {
          const changeFiatValue = utxo.fiat_val - spentFiatValue;
          const changeUtxo = await createUtxo(
            changeWeight,
            changeFiatValue,
            vault_loc,
            sender,
            transaction.id,
            true,
            utxo.acquired_at,
            (changeWeight / utxo.weight) * utxo.acquisition_fiat_val
          );
          await createUtxoHistoryEntry(changeUtxo.id, sender, sender, changeFiatValue, changeWeight, true, utxo.id, vault_loc);
          involvedVaultLocs.add(vault_loc);
        }
      }
    }

    if (remainingWeight > 0) {
      throw new Error('Insufficient funds');
    }

    await confirmTransaction(transaction.id);
    await createTransactionHistoryEntry(
      transaction.id,
      sender,
      recipient,
      weight,
      fiat_value,
      fee,
      transaction_type,
      metadata,
      Array.from(involvedVaultLocs)
    );

    await client.query('COMMIT');

    logger.info(`Transaction completed: ${transaction.id}`);
    res.json({
      status: 'success',
      transaction_id: transaction.id,
      fee,
      contextual_data_id: contextualDataId,
      output_utxos: outputUtxos.map(utxo => ({
        id: utxo.id,
        weight: utxo.weight,
        fiat_val: utxo.fiat_val,
        vault_loc: utxo.vault_loc
      }))
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Transaction failed: ${error.message}`);
    res.status(400).json({ status: 'failed', error: error.message });
  } finally {
    client.release();
  }
};

const getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      logger.warn(`Transaction not found: ${transactionId}`);
      return res.status(404).json({ status: 'failed', error: 'Transaction not found' });
    }
    logger.info(`Transaction status retrieved: ${transactionId}`);
    res.json({ status: 'success', transaction });
  } catch (error) {
    logger.error(`Error retrieving transaction status: ${error.message}`);
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

const getUserTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await getUserTransactions(userId);
    logger.info(`Transaction history retrieved for user: ${userId}`);
    res.json({ status: 'success', transactions });
  } catch (error) {
    logger.error(`Error retrieving user transaction history: ${error.message}`);
    res.status(400).json({ status: 'failed', error: error.message });
  }
};

module.exports = { initiateTransaction, getTransactionStatus, getUserTransactionHistory };