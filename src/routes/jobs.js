const express = require('express');
const router = express.Router();
const jobsController = require('../controllers/jobs');

router.get('/unpaid', jobsController.getUnpaidJobs);
router.post('/:job_id/pay', jobsController.payJob);

module.exports = router;