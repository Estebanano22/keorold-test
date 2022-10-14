const Sequelize = require('sequelize');
const db = require('../config/db');
const { v4: uuid_v4 } = require('uuid');

const Arrays = db.define('arrays_keo', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: uuid_v4()
    },
    array: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue : null
    },
    result: {
        type: Sequelize.INTEGER,
        defaultValue : null
    },
    fecha: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
});

module.exports = Arrays;
