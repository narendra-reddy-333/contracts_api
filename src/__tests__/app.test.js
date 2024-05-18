// __tests__/app.test.js
const request = require('supertest');
const app = require('../app'); // Assuming you have an app.js file for your Express app
const { Job, Profile, Contract, sequelize } = require('../models');
const { ProfileTypes, ContractStatuses } = require('../constants');

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
    await Profile.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Job.destroy({ where: {} });
}

describe('API Tests', () => {
    beforeEach(async () => {
        await clearDatabase();
        await createMockData();
    });

    afterEach(async () => {
        await clearDatabase();
    });

    describe('Admin Routes', () => {
        describe('GET /admin/best-profession', () => {
            it('should return the best profession by time range', async () => {
                const start = new Date('2023-01-01');
                const end = new Date('2023-12-31');
                const response = await request(app)
                    .get('/admin/best-profession')
                    .query({ start: start.toISOString(), end: end.toISOString() });

                expect(response.status).toBe(200);
                expect(response.body.profession).toBe('Software Engineer');
            });

            it('should return 400 for invalid date format', async () => {
                const response = await request(app)
                    .get('/admin/best-profession')
                    .query({ start: 'invalid', end: 'invalid' });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid date format');
            });

            it('should return 404 if no professions found', async () => {
                await Job.destroy({ where: {} });
                const response = await request(app)
                    .get('/admin/best-profession')
                    .query({ start: '2023-01-01', end: '2023-12-31' });

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('No professions found');
            });
        });

        describe('GET /admin/best-clients', () => {
            it('should return the best clients by time range', async () => {
                const start = new Date('2023-01-01');
                const end = new Date('2023-12-31');
                const response = await request(app)
                    .get('/admin/best-clients')
                    .query({ start: start.toISOString(), end: end.toISOString() });

                expect(response.status).toBe(200);
                expect(response.body.length).toBe(1);
                expect(response.body[0].fullName).toBe('John Doe');
            });

            it('should return 400 for invalid date format', async () => {
                const response = await request(app)
                    .get('/admin/best-clients')
                    .query({ start: 'invalid', end: 'invalid' });

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Invalid date format');
            });

            it('should return 404 if no clients found', async () => {
                await Profile.destroy({ where: { type: 'client' } });
                const response = await request(app)
                    .get('/admin/best-clients')
                    .query({ start: '2023-01-01', end: '2023-12-31' });

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('No clients found');
            });

            it('should handle limit parameter', async () => {
                const start = new Date('2023-01-01');
                const end = new Date('2023-12-31');
                const response = await request(app)
                    .get('/admin/best-clients')
                    .query({ start: start.toISOString(), end: end.toISOString(), limit: 1 });

                expect(response.status).toBe(200);
                expect(response.body.length).toBe(1);
            });
        });
    });

    describe('Balances Routes', () => {
        describe('POST /balances/:userId/deposit', () => {
            it('should deposit balance to client account', async () => {
                const userId = 1;
                const depositAmount = 100;
                const response = await request(app)
                    .post(`/balances/${userId}/deposit`)
                    .send({ amount: depositAmount })
                    .set('Authorization', `Bearer ${mockData.profiles[0].id}`);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Deposit successful');
                const updatedClient = await Profile.findByPk(userId);
                expect(updatedClient.balance).toBe(
                    mockData.profiles[0].balance + depositAmount
                );
            });

            it('should return 401 for unauthorized access', async () => {
                const userId = 1;
                const depositAmount = 100;
                const response = await request(app)
                    .post(`/balances/${userId}/deposit`)
                    .send({ amount: depositAmount })
                    .set('Authorization', `Bearer ${mockData.profiles[1].id}`); // Unauthorized user

                expect(response.status).toBe(401);
                expect(response.body.message).toBe('Unauthorized');
            });

            it('should return 404 if client not found', async () => {
                const userId = 100;
                const depositAmount = 100;
                const response = await request(app)
                    .post(`/balances/${userId}/deposit`)
                    .send({ amount: depositAmount })
                    .set('Authorization', `Bearer ${userId}`);

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('Client not found');
            });

            it('should return 400 if deposit amount exceeds limit', async () => {
                const userId = 1;
                const depositAmount = 500; // Exceeds 25% limit
                const response = await request(app)
                    .post(`/balances/${userId}/deposit`)
                    .send({ amount: depositAmount })
                    .set('Authorization', `Bearer ${userId}`);

                expect(response.status).toBe(400);
                expect(response.body.message).toBe(
                    'Deposit amount cannot exceed 25% of total jobs to pay'
                );
            });

            it('should handle concurrency errors', async () => {
                const userId = 1;
                const depositAmount = 100;

                // Simulate another deposit happening concurrently
                const concurrentDepositPromise = request(app)
                    .post(`/balances/${userId}/deposit`)
                    .send({ amount: depositAmount })
                    .set('Authorization', `Bearer ${userId}`);

                // Make the first deposit request
                const response = await request(app)
                    .post(`/balances/${userId}/deposit`)
                    .send({ amount: depositAmount })
                    .set('Authorization', `Bearer ${userId}`);

                // Wait for concurrent deposit to complete
                await concurrentDepositPromise;

                expect(response.status).toBe(409);
                expect(response.body.message).toBe(
                    'Concurrency error: Client balance has been updated. Please retry the deposit.'
                );
            });
        });
    });

    describe('Contracts Routes', () => {
        describe('GET /contracts', () => {
            it('should return contracts for a given profile', async () => {
                const profileId = 1;
                const response = await request(app)
                    .get('/contracts')
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(200);
                expect(response.body.length).toBe(1);
                expect(response.body[0].Client.firstName).toBe('John');
                expect(response.body[0].Contractor.firstName).toBe('Jane');
            });

            it('should return 401 if profile is not a client or contractor', async () => {
                const profileId = 100;
                const response = await request(app)
                    .get('/contracts')
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(401);
                expect(response.body.message).toBe('Unauthorized');
            });
        });

        describe('GET /contracts/:id', () => {
            it('should return a specific contract', async () => {
                const contractId = 1;
                const profileId = 1;
                const response = await request(app)
                    .get(`/contracts/${contractId}`)
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(200);
                expect(response.body.Client.firstName).toBe('John');
                expect(response.body.Contractor.firstName).toBe('Jane');
            });

            it('should return 404 if contract not found', async () => {
                const contractId = 100;
                const profileId = 1;
                const response = await request(app)
                    .get(`/contracts/${contractId}`)
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('Contract not found');
            });

            it('should return 401 if profile is not a client or contractor', async () => {
                const contractId = 1;
                const profileId = 100;
                const response = await request(app)
                    .get(`/contracts/${contractId}`)
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(401);
                expect(response.body.message).toBe('Unauthorized');
            });
        });
    });

    describe('Jobs Routes', () => {
        describe('GET /jobs/unpaid', () => {
            it('should return unpaid jobs for a profile', async () => {
                const profileId = 1;
                const response = await request(app)
                    .get('/jobs/unpaid')
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(200);
                expect(response.body.length).toBe(1);
                expect(response.body[0].price).toBe(200);
            });

            it('should return 401 if profile is not a client or contractor', async () => {
                const profileId = 100;
                const response = await request(app)
                    .get('/jobs/unpaid')
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(401);
                expect(response.body.message).toBe('Unauthorized');
            });
        });

        describe('POST /jobs/:job_id/pay', () => {
            it('should pay for a job', async () => {
                const jobId = 1;
                const profileId = 1;
                const response = await request(app)
                    .post(`/jobs/${jobId}/pay`)
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(200);
                expect(response.body.message).toBe('Job paid successfully');
                const updatedJob = await Job.findByPk(jobId);
                expect(updatedJob.paid).toBe(true);
            });

            it('should return 404 if job not found', async () => {
                const jobId = 100;
                const profileId = 1;
                const response = await request(app)
                    .post(`/jobs/${jobId}/pay`)
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('Job not found');
            });

            it('should return 401 if unauthorized (not a client)', async () => {
                const jobId = 1;
                const profileId = 2; // Unauthorized user (contractor)
                const response = await request(app)
                    .post(`/jobs/${jobId}/pay`)
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(401);
                expect(response.body.message).toBe(
                    'Unauthorized: You are not the client for this job'
                );
            });

            it('should return 400 if insufficient funds', async () => {
                const jobId = 1;
                const profileId = 1;
                await Profile.update(
                    { balance: 100 },
                    { where: { id: profileId } }
                ); // Update client balance to 100
                const response = await request(app)
                    .post(`/jobs/${jobId}/pay`)
                    .set('Authorization', `Bearer ${profileId}`);

                expect(response.status).toBe(400);
                expect(response.body.message).toBe('Insufficient funds');
            });

            it('should handle concurrency errors', async () => {
                const jobId = 1;
                const profileId = 1;

                // Simulate another payment happening concurrently
                const concurrentPaymentPromise = request(app)
                    .post(`/jobs/${jobId}/pay`)
                    .set('Authorization', `Bearer ${profileId}`);

                // Make the first payment request
                const response = await request(app)
                    .post(`/jobs/${jobId}/pay`)
                    .set('Authorization', `Bearer ${profileId}`);

                // Wait for concurrent payment to complete
                await concurrentPaymentPromise;

                expect(response.status).toBe(409);
                expect(response.body.message).toBe(
                    'Concurrency error: Client or Contractor balance has been updated, Pls try again.'
                );
            });
        });
    });
});