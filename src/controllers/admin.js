const adminService = require('../services/admin'); // Assuming you have a services/admin.js file

// Controller to get the best profession by time range
const getBestProfession = async (req, res) => {
    try {
        const {start, end} = req.query;

        // Validate date parameters
        if (!start || !end) {
            return res.status(400).json({message: 'Start and end dates are required'});
        }
        const startDate = new Date(start); // Parse start date
        const endDate = new Date(end); // Parse end date

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({message: 'Invalid date format'});
        }

        const bestProfession = await adminService.getBestProfessionByTimeRange(
            startDate,
            endDate
        );
        res.json(bestProfession);
    } catch (error) {
        if (error.message === 'No professions found') {
            return res.status(404).json({message: 'No professions found'});
        }
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

// Controller to get the best clients by time range
const getBestClients = async (req, res) => {
    try {
        const {start, end, limit = 2} = req.query;

        // Validate date parameters
        if (!start || !end) {
            return res.status(400).json({message: 'Start and end dates are required'});
        }

        const startDate = new Date(start); // Parse start date
        const endDate = new Date(end); // Parse end date

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        const bestClients = await adminService.getBestClientsByTimeRange(
            startDate,
            endDate,
            limit
        );
        res.json(bestClients);
    } catch (error) {
        if (error.message === 'No clients found') {
            return res.status(404).json({message: 'No clients found'});
        }
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

module.exports = {
    getBestProfession,
    getBestClients,
};