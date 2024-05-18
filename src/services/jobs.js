const {Job, Contract, Profile, sequelize} = require('../models');
const {Op} = require('sequelize');
const {ContractStatuses} = require("../constants");

// Retrieves all unpaid jobs for a given profile (client or contractor)
// for active contracts ('in_progress' status).
const getUnpaidJobsByProfileId = async (profileId) => {
    return await Job.findAll({
        where: {
            paid: false,
            // Find jobs associated with active contracts of the profile
            ContractId: {
                [Op.in]: await Contract.findAll({
                    where: {
                        // Check if the profile is either the client or contractor
                        [Op.or]: [{ClientId: profileId}, {ContractorId: profileId}],
                        status: ContractStatuses.IN_PROGRESS,
                    },
                }).then((contracts) => contracts.map((c) => c.id)),
            },
        },
        include: [
            {
                model: Contract,
                include: [
                    // Include client and contractor information for each job
                    {
                        model: Profile,
                        as: 'Client',
                        attributes: ['firstName', 'lastName'],
                    },
                    {
                        model: Profile,
                        as: 'Contractor',
                        attributes: ['firstName', 'lastName'],
                    },
                ],
            },
        ],
    });
};

// Pays for a job by a client. Handles authorization, sufficient funds,
// and concurrent updates using optimistic locking.
const payJobByIdAndClientId = async (jobId, clientId) => {
    // Retrieve the job record
    const job = await Job.findByPk(jobId, {include: Contract});

    // Check if the job exists
    if (!job) {
        throw new Error('Job not found');
    }
    // Authorize the client
    if (job.Contract.ClientId !== clientId) {
        throw new Error('Unauthorized: You are not the client for this job');
    }

    // Retrieve client and contractor profiles
    const client = await Profile.findByPk(clientId);
    const contractor = await Profile.findByPk(job.Contract.ContractorId);

    // Check if both client and contractor exist
    if (!client || !contractor) {
        throw new Error('Client or Contractor not found');
    }

    // Use a transaction to ensure atomicity and handle concurrency
    await sequelize.transaction(async (t) => {
        // Check for sufficient funds
        if (client.balance < job.price) {
            throw new Error('Insufficient funds');
        }

        // Update balances using Sequelize's optimistic locking
        try {
            // Update client balance
            await client.update(
                {balance: client.balance - job.price},
                {transaction: t}
            );

            // Update contractor balance
            await contractor.update(
                {balance: contractor.balance + job.price},
                {transaction: t}
            );


            // Update job status
            await job.update(
                {paid: true, paymentDate: new Date()},
                {transaction: t}
            );
            // Return success message
            return {message: 'Job paid successfully'};
        } catch (error) {
            // Handle optimistic locking errors
            if (error.name === 'SequelizeOptimisticLockError') {
                throw new Error(
                    'Concurrency error: Client or Contractor balance has been updated, Pls try again.'
                );
            }
            // Re-throw other errors
            throw error;
        }
    });
};
// Implementation using Pessimistic Locks.
// const payJobByIdAndClientId = async (jobId, clientId) => {
//     // Retrieve the job record
//     const job = await Job.findByPk(jobId, { include: Contract });
//
//     // Check if the job exists
//     if (!job) {
//         throw new Error('Job not found');
//     }
//     // Authorize the client
//     if (job.Contract.ClientId !== clientId) {
//         throw new Error('Unauthorized: You are not the client for this job');
//     }
//
//     // Retrieve client and contractor profiles
//     const client = await Profile.findByPk(clientId);
//     const contractor = await Profile.findByPk(job.Contract.ContractorId);
//
//     // Check if both client and contractor exist
//     if (!client || !contractor) {
//         throw new Error('Client or Contractor not found');
//     }
//
//     // Pessimistic Locking: Acquire locks on job, client, and contractor
//     await Promise.all([
//         Job.lock(jobId, { lockMode: 'UPDATE' }),
//         Profile.lock(clientId, { lockMode: 'UPDATE' }), // Lock client
//         Profile.lock(job.Contract.ContractorId, { lockMode: 'UPDATE' }), // Lock contractor
//     ]);
//
//     try {
//         // Check for sufficient funds (using the locked client record)
//         if (client.balance < job.price) {
//             throw new Error('Insufficient funds');
//         }
//
//         // Update balances and job status using Sequelize's transaction
//         await sequelize.transaction(async (t) => {
//             // Update client balance
//             await client.update(
//                 { balance: client.balance - job.price },
//                 { transaction: t }
//             );
//
//             // Update contractor balance
//             await contractor.update(
//                 { balance: contractor.balance + job.price },
//                 { transaction: t }
//             );
//
//             // Update job status
//             await job.update(
//                 { paid: true, paymentDate: new Date() },
//                 { transaction: t }
//             );
//             // Return success message
//             return { message: 'Job paid successfully' };
//         });
//     } catch (error) {
//         // Handle specific error cases
//         if (error.message === 'Insufficient funds') {
//             return res.status(400).json({ message: 'Insufficient funds' });
//         }
//         // Re-throw other errors
//         throw error;
//     } finally {
//         // Release all locks
//         await Promise.all([
//             Job.unlock(jobId),
//             Profile.unlock(clientId), // Unlock client
//             Profile.unlock(job.Contract.ContractorId), // Unlock contractor
//         ]);
//     }
// };

module.exports = {
    getUnpaidJobsByProfileId,
    payJobByIdAndClientId,
};