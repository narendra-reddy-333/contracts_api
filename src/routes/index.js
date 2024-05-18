// index.js
const express = require('express');
const router = express.Router();

// Import your routes
const contractsRouter = require('./contracts');
const jobsRouter = require('./jobs');
const balancesRouter = require('./balances');
const adminRouter = require('./admin');

const getProfile = require('../middleware/getProfile'); // Assuming this is the auth middleware

router.use(getProfile); // Apply to all routes belo


// Mount the routes
router.use('/contracts', contractsRouter);
router.use('/jobs', jobsRouter);
router.use('/balances', balancesRouter);
router.use('/admin', adminRouter);

module.exports = router;