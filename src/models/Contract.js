module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Contract', {
        terms: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('new', 'in_progress', 'terminated'),
            defaultValue: 'new',
        },
    });
};
