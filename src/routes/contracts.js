const express = require('express');
const router = express.Router();
const contractsController = require('../controllers/contracts');


router.get('/', contractsController.getContracts);
router.get('/:id', contractsController.getContractById);

module.exports = router;