// src/models/index.js
const Sequelize = require('sequelize');
const dbConfig = require('../config/db');

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    storage: './database.sqlite3', // SQLite file
    logging: false, // Disable Sequelize logging
});

const Profile = require('./Profile')(sequelize, Sequelize.DataTypes);
const Contract = require('./Contract')(sequelize, Sequelize.DataTypes);
const Job = require('./Job')(sequelize, Sequelize.DataTypes);

// Define relationships
Profile.hasMany(Contract, {as: 'Contractor', foreignKey: 'ContractorId'});
Contract.belongsTo(Profile, {as: 'Contractor'});

Profile.hasMany(Contract, {as: 'Client', foreignKey: 'ClientId'});
Contract.belongsTo(Profile, {as: 'Client'});

Contract.hasMany(Job);
Job.belongsTo(Contract);

module.exports = {
    Profile,
    Contract,
    Job,
    sequelize,
};