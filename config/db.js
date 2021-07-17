const { Sequelize } = require('sequelize');
const db = new Sequelize('fullentretenimiento_2021_ok', 'fullesteban2021', 'NewFullentretenimiento123*', {
    host: '/cloudsql/fullentretenimiento:us-central1:fullbasegoogle',
    dialect: 'mysql',
    port: 3306,
    dialectOptions: {
        charset: 'utf8_general_ci',
        socketPath: '/cloudsql/fullentretenimiento:us-central1:fullbasegoogle'
    },
    define: {
        timestamps: false
    },
    // pool: {
    //     max: 5,
    //     min: 0,
    //     acquire: 30000,
    //     idle: 10000
    // },
    logging: false
});

module.exports = db;
