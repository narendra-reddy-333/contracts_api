// constants/index.js
const ProfileTypes = {
    CLIENT: 'client',
    CONTRACTOR: 'contractor',
};

const ContractStatuses = {
    new: "new",
    IN_PROGRESS: 'in_progress',
    TERMINATED: 'terminated',
};
const DEBT_RATIO = 0.25;

module.exports = {
    ProfileTypes,
    ContractStatuses,
    DEBT_RATIO
};
