const {Profile} = require('../models');

const getProfile = async (req, res, next) => {
    try {
        const profileId = req.get('profile_id');
        if (!profileId) {
            return res.status(401).json({message: 'Profile ID is required'});
        }

        const profile = await Profile.findByPk(profileId);

        if (!profile) {
            return res.status(404).json({message: 'Profile not found'});
        }

        req.profile = profile; // Attach the profile to the request
        next(); // Pass control to the next middleware or route handler
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

module.exports = getProfile; // Export the function as a middleware