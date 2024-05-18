module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Profile', {
        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        profession: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        balance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.0,
        },
        type: {
            type: DataTypes.ENUM('client', 'contractor'),
            allowNull: false,
        },
    }, {
        version: true // for optimistic locking.
    });
};