const { Profile, Job, Contract, sequelize } = require('../models');
const { Op } = require('sequelize');
const {DEBT_RATIO} = require("../constants");

// Handles depositing money into a client's balance
const depositBalanceByUserId = async (userId, depositAmount) => {
    // Retrieve client profile
    const client = await Profile.findByPk(userId);

    // Check if client exists
    if (!client) {
        throw new Error('Client not found');
    }

    // Calculate total unpaid jobs for the client
    const totalJobsToPay = await Job.findAll({
        where: {
            // Find jobs associated with client's contracts
            ContractId: {
                [Op.in]: await Contract.findAll({
                    where: { ClientId: userId },
                }).then((contracts) => contracts.map((c) => c.id)),
            },
            // Only include unpaid jobs
            paid: false,
        },
    }).then((jobs) => jobs.reduce((sum, job) => sum + job.price, 0));

    // Check deposit limit
    if (depositAmount > totalJobsToPay * DEBT_RATIO) {
        throw new Error(
            'Deposit amount cannot exceed 25% of total jobs to pay'
        );
    }

    // Use a transaction for concurrent updates
    await sequelize.transaction(async (t) => {
        // Update balance with optimistic locking
        try {
            await client.update(
                { balance: client.balance + depositAmount },
                { transaction: t }
            );

            // Return success message
            return { message: 'Deposit successful' };
        } catch (error) {
            // Handle optimistic locking errors
            if (error.name === 'SequelizeOptimisticLockError') {
                throw new Error(
                    'Concurrency error: Client balance has been updated. Please retry the deposit.'
                );
            } else {
                throw error;
            }
        }
    });
};

module.exports = {
    depositBalanceByUserId,
};