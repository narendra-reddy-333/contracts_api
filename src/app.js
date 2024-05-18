const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const {sequelize} = require('./models');

const app = express();
app.use(express.json());

app.use('/api', routes);

// Synchronize models
sequelize
    .sync()
    .then(() => {
        console.log('Database synced');
    })
    .catch((err) => {
        console.error('Failed to sync database:', err);
    });

module.exports = app;