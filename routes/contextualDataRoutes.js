const express = require('express');
const { createContextualDataHandler, getContextualDataHandler } = require('../controllers/contextualDataController');

const router = express.Router();

router.post('/', createContextualDataHandler);
router.get('/:refId', getContextualDataHandler);

module.exports = router;