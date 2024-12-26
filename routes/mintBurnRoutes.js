const express = require('express');
const { mintGold, burnGold } = require('../controllers/mintBurnController');

const router = express.Router();

router.post('/mint', mintGold);
router.post('/burn', burnGold);

module.exports = router;