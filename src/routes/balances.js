const express = require('express');
const router = express.Router();
const balancesController = require('../controllers/balances');


router.post('/deposit/:userId', balancesController.depositBalance);

module.exports = router;