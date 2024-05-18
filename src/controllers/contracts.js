const contractsService = require('../services/contracts');

const getContracts = async (req, res) => {

    try {
        const profile_id = req.profile.id;
        const contracts = await contractsService.getContractsByProfileId(profile_id);
        res.json(contracts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getContractById = async (req, res) => {
    try {
        const { id } = req.params;
        const profile_id = req.profile.id;
        const contract = await contractsService.getContractByIdAndProfileId(
            id,
            profile_id
        );

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }
        res.json(contract);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getContracts,
    getContractById,
};