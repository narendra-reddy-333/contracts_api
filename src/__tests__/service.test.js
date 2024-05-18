const {Job, Profile, Contract, sequelize} = require('../models');
const {
    getBestProfessionByTimeRange,
    getBestClientsByTimeRange,
} = require('../services/admin');
const {depositBalanceByUserId} = require('../services/balances');
const {
    getContractsByProfileId,
    getContractByIdAndProfileId,
} = require('../services/contracts');
const {
    getUnpaidJobsByProfileId,
    payJobByIdAndClientId,
} = require('../services/jobs');
const {ProfileTypes, ContractStatuses} = require('../constants');

// Mock data for testing
const mockData = {
    profiles: [
        {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            type: ProfileTypes.CLIENT,
            balance: 1000,
        },
        {
            id: 2,
            firstName: 'Jane',
            lastName: 'Doe',
            type: ProfileTypes.CONTRACTOR,
            profession: 'Software Engineer',
            balance: 500,
        },
    ],
    contracts: [
        {
            id: 1,
            ClientId: 1,
            ContractorId: 2,
            status: ContractStatuses.IN_PROGRESS,
        },
    ],
    jobs: [
        {
            id: 1,
            ContractId: 1,
            price: 200,
            paid: false,
            paymentDate: null,
        },
        {
            id: 2,
            ContractId: 1,
            price: 300,
            paid: true,
            paymentDate: new Date(),
        },
    ],
};

// Helper function to create mock data in the database
async function createMockData() {
    await Promise.all(
        mockData.profiles.map((profile) => Profile.create(profile))
    );
    await Promise.all(
        mockData.contracts.map((contract) => Contract.create(contract))
    );
    await Promise.all(mockData.jobs.map((job) => Job.create(job)));
}

// Helper function to clear the database
async function clearDatabase() {
    await Profile.destroy({where: {}});
    await Contract.destroy({where: {}});
    await Job.destroy({where: {}});
}

describe('Services Tests', () => {
    beforeEach(async () => {
        await clearDatabase();
        await createMockData();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    describe('Admin Services', () => {
        describe('getBestProfessionByTimeRange', () => {
            it('should return the best profession by time range', async () => {
                const start = new Date('2023-01-01');
                const end = new Date('2023-12-31');
                const bestProfession = await getBestProfessionByTimeRange(
                    start,
                    end
                );

                expect(bestProfession.profession).toBe('Software Engineer');
            });
        });

        describe('getBestClientsByTimeRange', () => {
            it('should return the best clients by time range', async () => {
                const start = new Date('2023-01-01');
                const end = new Date('2023-12-31');
                const bestClients = await getBestClientsByTimeRange(
                    start,
                    end
                );

                expect(bestClients.length).toBe(1);
                expect(bestClients[0].fullName).toBe('John Doe');
            });

            it('should handle limit parameter', async () => {
                const start = new Date('2023-01-01');
                const end = new Date('2023-12-31');
                const bestClients = await getBestClientsByTimeRange(
                    start,
                    end,
                    1
                );

                expect(bestClients.length).toBe(1);
            });
        });
    });

    describe('Balances Services', () => {
        describe('depositBalanceByUserId', () => {
            it('should deposit balance to client account', async () => {
                const userId = 1;
                const depositAmount = 100;
                await depositBalanceByUserId(userId, depositAmount);
                const updatedClient = await Profile.findByPk(userId);

                expect(updatedClient.balance).toBe(
                    mockData.profiles[0].balance + depositAmount
                );
            });

            it('should throw an error if client not found', async () => {
                const userId = 100;
                const depositAmount = 100;
                await expect(
                    depositBalanceByUserId(userId, depositAmount)
                ).rejects.toThrowError('Client not found');
            });

            it('should throw an error if deposit amount exceeds limit', async () => {
                const userId = 1;
                const depositAmount = 500;
                await expect(
                    depositBalanceByUserId(userId, depositAmount)
                ).rejects.toThrowError(
                    'Deposit amount cannot exceed 25% of total jobs to pay'
                );
            });

            it('should handle concurrency errors', async () => {
                const userId = 1;
                const depositAmount = 100;

                // Simulate another deposit happening concurrently
                const concurrentDepositPromise = depositBalanceByUserId(
                    userId,
                    depositAmount
                );

                // Make the first deposit request
                await expect(
                    depositBalanceByUserId(userId, depositAmount)
                ).rejects.toThrowError(
                    'Concurrency error: Client balance has been updated. Please retry the deposit.'
                );

                // Wait for concurrent deposit to complete
                await concurrentDepositPromise;
            });
        });
    });

    describe('Contracts Services', () => {
        describe('getContractsByProfileId', () => {
            it('should return contracts for a given profile', async () => {
                const profileId = 1;
                const contracts = await getContractsByProfileId(profileId);

                expect(contracts.length).toBe(1);
                expect(contracts[0].Client.firstName).toBe('John');
                expect(contracts[0].Contractor.firstName).toBe('Jane');
            });
        });

        describe('getContractByIdAndProfileId', () => {
            it('should return a specific contract', async () => {
                const contractId = 1;
                const profileId = 1;
                const contract = await getContractByIdAndProfileId(
                    contractId,
                    profileId
                );

                expect(contract.Client.firstName).toBe('John');
                expect(contract.Contractor.firstName).toBe('Jane');
            });

            it('should return null if contract not found', async () => {
                const contractId = 100;
                const profileId = 1;
                const contract = await getContractByIdAndProfileId(
                    contractId,
                    profileId
                );

                expect(contract).toBeNull();
            });
        });
    });

    describe('Jobs Services', () => {
        describe('getUnpaidJobsByProfileId', () => {
            it('should return unpaid jobs for a profile', async () => {
                const profileId = 1;
                const unpaidJobs = await getUnpaidJobsByProfileId(profileId);

                expect(unpaidJobs.length).toBe(1);
                expect(unpaidJobs[0].price).toBe(200);
            });
        });

        describe('payJobByIdAndClientId', () => {
            it('should pay for a job', async () => {
                const jobId = 1;
                const clientId = 1;
                await payJobByIdAndClientId(jobId, clientId);
                const updatedJob = await Job.findByPk(jobId);

                expect(updatedJob.paid).toBe(true);
            });

            it('should throw an error if job not found', async () => {
                const jobId = 100;
                const clientId = 1;
                await expect(
                    payJobByIdAndClientId(jobId, clientId)
                ).rejects.toThrowError('Job not found');
            });

            it('should throw an error if unauthorized', async () => {
                const jobId = 1;
                const clientId = 2; // Unauthorized user (contractor)
                await expect(
                    payJobByIdAndClientId(jobId, clientId)
                ).rejects.toThrowError(
                    'Unauthorized: You are not the client for this job'
                );
            });

            it('should throw an error if insufficient funds', async () => {
                const jobId = 1;
                const clientId = 1;
                await Profile.update({balance: 100}, {where: {id: clientId}}); // Update client balance to 100
                await expect(
                    payJobByIdAndClientId(jobId, clientId)
                ).rejects.toThrowError('Insufficient funds');
            });

            it('should handle concurrency errors', async () => {
                const jobId = 1;
                const clientId = 1;

                // Simulate another payment happening concurrently
                const concurrentPaymentPromise = payJobByIdAndClientId(
                    jobId,
                    clientId
                );

                // Make the first payment request
                await expect(
                    payJobByIdAndClientId(jobId, clientId)
                ).rejects.toThrowError(
                    'Concurrency error: Client or Contractor balance has been updated, Pls try again.'
                );

                // Wait for concurrent payment to complete
                await concurrentPaymentPromise;
            });
        });
    });
});