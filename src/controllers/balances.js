const balancesService = require('../services/balances');

const depositBalance = async (req, res) => {
    try {
        const {userId} = req.params;
        const profile_id = req.profile.id;
        const depositAmount = req.body.amount;
        if (parseInt(userId) !== parseInt(profile_id)) {
            return res.status(401).json({message: 'Unauthorized'});
        }

        await balancesService.depositBalanceByUserId(userId, depositAmount);

        res.json({message: 'Deposit successful'});
    } catch (error) {
        if (error.message === 'Client not found') {
            return res.status(404).json({message: 'Client not found'});
        }
        if (
            error.message ===
            'Deposit amount cannot exceed 25% of total jobs to pay'
        ) {
            return res
                .status(400)
                .json({message: 'Deposit amount cannot exceed 25% of total jobs to pay'});
        }
        if (error.message.startsWith('Concurrency error')) {
            return res.status(409).json({message: error.message});
        }

        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

module.exports = {
    depositBalance,
};