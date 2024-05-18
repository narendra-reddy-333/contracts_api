const jobsService = require('../services/jobs'); // Assuming you have a services/Job.js file

// Controller to get unpaid jobs for a profile
const getUnpaidJobs = async (req, res) => {
    try {
        const profile_id = req.profile.id;
        const unpaidJobs = await jobsService.getUnpaidJobsByProfileId(profile_id);
        res.json(unpaidJobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to pay for a job
const payJob = async (req, res) => {
    try {
        const { job_id } = req.params;
        const profile_id = req.profile.id;
        await jobsService.payJobByIdAndClientId(job_id, profile_id);
        res.status(200).json({ message: 'Job paid successfully' });
    } catch (error) {
        if (error.message === 'Job not found') {
            return res.status(404).json({ message: 'Job not found' });
        }
        if (error.message === 'Unauthorized: You are not the client for this job') {
            return res
                .status(401)
                .json({ message: 'Unauthorized: You are not the client for this job' });
        }
        if (error.message === 'Insufficient funds') {
            return res.status(400).json({ message: 'Insufficient funds' });
        }
        if (error.message.startsWith('Concurrency error')) {
            return res.status(409).json({ message: error.message });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getUnpaidJobs,
    payJob,
};