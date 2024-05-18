const {Job, Profile, Contract} = require('../models');
const {Op, fn, col, literal, DataTypes} = require('sequelize');

// Finds the profession that has earned the most money from paid jobs
// within a given time range.
const getBestProfessionByTimeRange = async (start, end) => {
    const bestProfession = await Profile.findAll({
        attributes: [
            'profession',
            [fn('SUM', col('price')), 'total_earned'], // Calculate total earnings for each profession
        ],
        include: [
            {
                model: Contract,
                required: true,
                as: 'Contractor',
                where: {
                    status: 'in_progress', // Only consider active contracts
                },
                attributes: [],
                include: [
                    {
                        model: Job,
                        required: true,
                        where: {
                            paymentDate: {
                                [Op.between]: [start, end], // Filter jobs within the specified time range
                            },
                            paid: true // Only consider paid jobs
                        },
                        attributes: []
                    },
                ],
            },
        ],
        where: {
            type: 'contractor',
        },
        group: ['profession'], // Group results by profession
        order: [[literal('total_earned'), 'DESC']], // Sort by total earnings in descending order
        limit: 1, // Get the top-earning profession,
        subQuery: false
    });

    if (bestProfession.length === 0) {
        throw new Error('No professions found');
    }

    return bestProfession[0]; // Return the top-earning profession
};

// Finds the clients who have paid the most for jobs within a given time range.
// The result is limited by the 'limit' parameter (defaulting to 2).
const getBestClientsByTimeRange = async (start, end, limit = 2) => {
    const bestClients = await Profile.findAll({
        attributes: [
            'id',
            [fn('SUM', col('price')), 'total_paid'],
            [fn('concat', col('firstName'), ' ', col('lastName')), 'fullName'], // Concatenate first and last names
        ],
        include: [
            {
                model: Contract,
                required: true,
                as: 'Client',
                where: {
                    status: 'in_progress',
                },
                attributes: [],
                include: [
                    {
                        model: Job,
                        required: true,
                        where: {
                            paymentDate: {
                                [Op.between]: [start, end],
                            },
                            paid: true
                        },
                        attributes: []
                    },
                ],
            },
        ],
        group: ['fullName'], // Group by first name and last name
        order: [[literal('total_paid'), 'DESC']],
        limit: limit,
        subQuery: false
    });

    if (bestClients.length === 0) {
        throw new Error('No clients found');
    }

    return bestClients;
};

module.exports = {
    getBestProfessionByTimeRange,
    getBestClientsByTimeRange,
};