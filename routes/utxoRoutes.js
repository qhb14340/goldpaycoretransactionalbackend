const express = require('express');
const { getUserUtxosHandler, getUtxoDetailsHandler } = require('../controllers/utxoController');

const router = express.Router();

router.get('/user/:userId', getUserUtxosHandler);
router.get('/:utxoId', getUtxoDetailsHandler);

module.exports = router;