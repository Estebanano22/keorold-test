const Usuarios = require('../models/UsuariosModelo');
const Consignaciones = require('../models/consignacionesModelo');
const Medios = require('../models/mediosModelo');
const { Op } = require("sequelize");
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');

exports.reportarConsignacion = async (req, res) => {

    const consignaciones = await Consignaciones.findAll({
        where: {
            [Op.and]: [{usuarioIdUsuario: req.user.id_usuario}]
        },
        order: [['fecha', 'DESC']]
    });

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});

    const medios = await Medios.findAll({ 
        where: {
            [Op.and]: [{idSuperdistribuidor: superdistribuidor.id_usuario}, {estado: 1}]
        }
    });
    
    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});

    res.render('dashboard/reportarConsignacion', {
        nombrePagina : 'Reportar consignaciones',
        titulo: 'Reportar consignaciones',
        breadcrumb: 'Reportar consignaciones',
        classActive: req.path.split('/')[2],
        usuario,
        consignaciones,
        medios
    })

}

const configuracionMulter = {
    storage: fileStorage = multer.diskStorage({
        destination: (req, res, next) => {
            next(null, __dirname+'/../public/uploads/vouchers/');
        },
        filename: (req, file, next) => {
            const extencion = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extencion}`);
        }
    })
};

const upload = multer(configuracionMulter).single('comprobante');

exports.uploadComprobante = async (req, res, next) => {

    upload(req, res, function(error) {
        if(error){
            res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Hubo un error con el archivo que desea subir.' });
            return;
        } else {
            next();
        }
    })
}

exports.subirConsignacion = async (req, res) => {

    const valorConsignado = req.body.valorConsignado;
    const tipoConsignacion = req.body.tipoConsignacion;
    const referencia = req.body.referencia; 
    const telefonoCuenta = req.body.telefonoCuenta;
    const comprobante = req.body.comprobante;

    if(comprobante === 'undefined') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debe subir el pantallazo o foto legible del comprobante de consignación ó transferencia.' });
        return;
    }

    if(telefonoCuenta === '') {
        var telefono = 'no aplica';
    } else {
        var telefono = telefonoCuenta;
    }

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});

    if(valorConsignado === '' || tipoConsignacion === '' || referencia === '' || comprobante === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Por favor llene todos los campos.' });
        return;
    }

    await Consignaciones.create({
        idConsignacion: uuid_v4(),
        idSuperdistribuidor: superdistribuidor.id_usuario,
        valor: valorConsignado,
        estado: 0,
        tipoConsignacion: tipoConsignacion,
        referencia: referencia,
        comprobante: req.file.filename,
        usuarioIdUsuario: req.user.id_usuario,
        celularConsignacion: telefono
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Consignación reportada con éxito.' });
    return;

}