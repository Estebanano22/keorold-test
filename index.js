const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const axios = require('axios');
const routes = require('./routes');
const socketIO = require('socket.io');
const moment = require('moment');
const timeout = require('connect-timeout');
const genuuid = require('uuid');

const redis = require('redis');
const redisStore = require('connect-redis')(session);

// crear conexion ala DB
const db = require('./config/db');

// Importar modelo
require('./models/UsuariosModelo');
require('./models/plataformasModelo');
require('./models/marcasModelo');
require('./models/asignacionesModelo');
require('./models/cuentasModelo');
require('./models/gananciasModelo');
require('./models/consignacionesModelo');
require('./models/mediosModelo');
require('./models/linksPseModelo');
require('./models/insidenciasModelo');
require('./models/cargasModelo');
require('./models/preguntasModelo');
require('./models/publicidadModelo');

db.sync()
    .then(() => console.log('Conectado a la base de datos'))
    .catch(error => console.log(error));

// Variables de entorno
dotenv.config({
    path: path.resolve(__dirname, 'production.env')
});

// Redis connection server
const REDIS_CLIENT_PASSWORD = process.env.REDIS_CLIENT_PASSWORD
REDIS_CLIENT_HOST = process.env.REDIS_CLIENT_HOST,
    REDIS_CLIENT_PORT = process.env.REDIS_CLIENT_PORT,
    REDIS_CLIENT_USER = process.env.REDIS_CLIENT_USER;

const url = `redis://${REDIS_CLIENT_USER}:${REDIS_CLIENT_PASSWORD}@${REDIS_CLIENT_HOST}:${REDIS_CLIENT_PORT}`;

const redisClient = redis.createClient(url);

// Events and errors from redis
redisClient.on('connect', () => {
    console.log('Connected with redis');
});

redisClient.on('error', (err) => {
    console.log('Redis error: ', err);
});

// crear el servidor
const app = express();

// habilitar EJS
app.set('view engine', 'ejs');

// ubicacion vistas
app.set('views', path.join(__dirname, './views'));

// archivos estaticos
app.use(express.static('public'));

// habilitar cookie parser
app.use(cookieParser());


// Asignando redis para la sesión
app.use(session({
    genid: (req) => {
        return genuuid.v4();
    },
    store: new redisStore({
        host: REDIS_CLIENT_HOST,
        port: REDIS_CLIENT_PORT,
        client: redisClient
    }),
    name: 'x-sotken',
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 3600000,
    },
    saveUninitialized: true
}));

// inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// Agregar flash messages
app.use(flash());

// Middleware's (usuario logueado, flash messages, fecha actual)
app.use(async (req, res, next) => {
    res.locals.usuario = { ...req.user } || null;
    res.locals.mensajes = req.flash();
    const paises = await axios.get('http://' + req.headers.host + '/assetsDashboard/json/paises.json');
    res.locals.paises = paises;
    const fecha = new Date();
    res.locals.year = fecha.getFullYear();
    res.locals.fecha = fecha.toLocaleString('es-CO');
    res.locals.moment = moment;
    next();
});

// habilitar bodyparser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rutas de la app
app.use('/', routes());

// Error 404
app.get('*', function (req, res) {
    res.status(404).render('404', {
        nombrePagina: 'Pagina no encontrada'
    })
});

// puerto
const puerto = process.env.PORT || 5001;
const server = app.listen(puerto, () => {
    console.log(`Corriendo correctamente en el puerto - ${puerto}`);
});

// // Socket
// const io = socketIO(server);

// // websockets
// io.on('connection', () => {
//     console.log('Nueva conexión');
// });
