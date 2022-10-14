const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const routes = require('./routes');
// Swagger
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerSpect = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Prueba técnica Lider Backend - KeoWorld",
            version: "1.0.0"
        },
        servers: [
            {
                url: process.env.SERV
            }
        ]
    },
    apis: [`${path.join(__dirname, './routes/*.js')}`]
};

// crear conexion ala DB
const db = require('./config/db');

// Importar modelo
require('./models/arraysModelo');

db.sync()
    .then(() => console.log('Conectado a la base de datos'))
    .catch(error => console.log(error));

// Variables de entorno
dotenv.config({
    path: path.resolve(__dirname, 'production.env')
});

// crear el servidor
const app = express();

// habilitar bodyparser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas de la app
app.use('/', routes());
app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerJsDoc(swaggerSpect)));

// puerto
const puerto = process.env.PORT || 8000;
const server = app.listen(puerto, () => {
    console.log(`Corriendo correctamente en el puerto - ${puerto}`);
});