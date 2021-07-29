const Usuarios = require('../models/UsuariosModelo');
const Plataformas = require('../models/plataformasModelo');
const Cargas = require('../models/cargasModelo');
const Asignaciones = require('../models/asignacionesModelo');
const Ganancias = require('../models/gananciasModelo');
const { Op } = require("sequelize");
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');
const fs = require('fs');
const xlsx = require('node-xlsx');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(__dirname, '../development.env')
});

exports.adminReporteCargas = async (req, res) => {

    const cargas = await Cargas.findAll({
        where: {
            [Op.and]:[{idSuperdistribuidor: req.user.id_usuario}]
        },
        include: [
            {model: Usuarios, foreignKey: 'usuarioIdUsuario'}
        ],
        order: [['fechaCarga', 'DESC']]
    })

    res.render('dashboard/adminReporteCargas', {
        nombrePagina : 'Reporte de Cargas',
        titulo: 'Reporte de Cargas',
        breadcrumb: 'Reporte de Cargas',
        classActive: req.path.split('/')[2],
        cargas
    })
    
}