const {Contract, Profile} = require('../models');
const {Op, where} = require('sequelize');
const {ContractStatuses} = require("../constants");

// Retrieves all non-terminated contracts associated with a specific profile (client or contractor).
const getContractsByProfileId = async (profileId) => {
    return await Contract.findAll({
        where: {
            // Checks if the profile is either the client or contractor for the contract
            [Op.or]: [{ClientId: profileId}, {ContractorId: profileId}],
            // Excludes terminated contracts
            status: {[Op.ne]: ContractStatuses.TERMINATED},
        },
        include: [
            // Includes client and contractor details for each contract
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
    });
};

// Retrieves a specific contract by its ID, ensuring it belongs to the provided profile (client or contractor).
const getContractByIdAndProfileId = async (id, profileId) => {
    return await Contract.findByPk(id, {
        where: {
            // Checks if the profile is either the client or contractor for the contract
            [Op.and]: [{ClientId: profileId}, {ContractorId: profileId}],
        },
        include: [
            // Includes client and contractor details for the contract
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
    });
};

module.exports = {
    getContractsByProfileId,
    getContractByIdAndProfileId,
};