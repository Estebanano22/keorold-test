const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const axios = require('axios');
const routes = require('./routes');
const socketIO = require('socket.io');

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

db.sync()
    .then(() => console.log('Conectado al servidor'))
    .catch(error => console.log('error al conectar'));

// Variables de entorno
require('dotenv').config({path: 'variables.env'});

// crear el servidor
const app = express();

// habilitar EJS
// app.use(expressLayouts);
app.set('view engine', 'ejs');

// ubicacion vistas
app.set('views', path.join(__dirname, './views'));

// archivos estaticos
app.use(express.static('public'));

// habilitar cookie parser
app.use(cookieParser());

// crear session
app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false
}));

// inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// Agregar flash messages
app.use(flash());

// Middleware's (usuario logueado, flash messages, fecha actual)
app.use( async (req, res, next) => {
    res.locals.usuario = {...req.user} || null;
    res.locals.mensajes = req.flash();
    const paises = await axios.get('http://'+req.headers.host+'/assetsDashboard/json/paises.json');
    res.locals.paises = paises;
    const fecha = new Date();
    res.locals.year = fecha.getFullYear();
    res.locals.fecha = fecha.toLocaleString('es-CO');
    next();
});

// habilitar bodyparser
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Rutas de la app
app.use('/', routes());

// Error 404
app.get('*', function(req, res){
res.status(404).render('404', {
    nombrePagina : 'Pagina no encontrada'
    })
});

// puerto
const server = app.listen(process.env.PORT, () => {
    console.log('Corriendo en el puerto 5000');
});

// // Socket
// const io = socketIO(server);

// // websockets
// io.on('connection', () => {
//     console.log('Nueva conexión');
// });