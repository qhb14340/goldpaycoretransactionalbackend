const express = require('express');
const { setFees, getFees } = require('../controllers/adminController');

const router = express.Router();

router.post('/fees', setFees);
router.get('/fees/:transaction_type', getFees);

module.exports = router;