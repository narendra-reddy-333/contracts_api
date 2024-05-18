module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Job', {
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        paid: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        paymentDate: {
            type: DataTypes.DATE,
        },
    });
};