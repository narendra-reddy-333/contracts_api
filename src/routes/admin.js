const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');

router.get('/best-profession', adminController.getBestProfession);
router.get('/best-clients', adminController.getBestClients);

module.exports = router;