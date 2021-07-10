const Usuarios = require('../models/UsuariosModelo');
const Insidencias = require('../models/insidenciasModelo');
const Plataformas = require('../models/plataformasModelo');
const { Op } = require("sequelize");
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');

exports.reportarInsidencia = async (req, res) => {

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});

    const insidencias = await Insidencias.findAll({ 
        where: { usuarioIdUsuario: req.user.id_usuario },
        order: [['fecha', 'DESC']]
    });

    const plataformas = await Plataformas.findAll({ 
        where: {
            [Op.and]:[{id_superdistribuidor: superdistribuidor.id_usuario}, {estado:1}]
        }
    });

    const countInsidenciasRespondidas = await Insidencias.count({ 
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }, {estado: 1}]
        }
    });

    const countInsidenciasNoRespondidas = await Insidencias.count({ 
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }, {estado: 0}]
        }
    });

    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});

    res.render('dashboard/reportarInsidencia', {
        nombrePagina : 'Reportar Insidencia',
        titulo: 'Reportar Insidencia',
        breadcrumb: 'Reportar Insidencia',
        classActive: req.path.split('/')[2],
        usuario,
        insidencias,
        countInsidenciasRespondidas,
        countInsidenciasNoRespondidas,
        plataformas
    })

}

const configuracionMulter = {
    storage: fileStorage = multer.diskStorage({
        destination: (req, res, next) => {
            next(null, __dirname+'/../public/uploads/insidencias/');
        },
        filename: (req, file, next) => {
            const extencion = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extencion}`);
        }
    })
};

const upload = multer(configuracionMulter).single('files');

exports.uploadArchivo = async (req, res, next) => {

    upload(req, res, function(error) {
        if(error){
            res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Hubo un error con el archivo que desea subir.' });
            return;
        } else {
            next();
        }
    })
}

exports.crearInsidencia = async (req, res) => {
    
    const asunto = req.body.asunto.trim();
    const idPlataforma = req.body.plataforma.trim();
    const descripcion = req.body.descripcion.trim();
    const archivo = req.body.files;

    if(asunto === '' || idPlataforma === '' || descripcion === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Por favor llene todos los campos.' });
        return;
    }

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});

    if(archivo === 'undefined') {
        var nombreArchivo = null;
    } else {
        var nombreArchivo = req.file.filename;
    }

    await Insidencias.create({
        idInsidencia: uuid_v4(),
        idSuperdistribuidor: superdistribuidor.id_usuario,
        estado: 0,
        asunto: asunto,
        descripcion: descripcion,
        plataformaIdPlataforma: idPlataforma,
        usuarioIdUsuario: req.user.id_usuario,
        imagen: nombreArchivo,
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Insidencia reportada con éxito.'});
    return;

}

exports.infoInsidencia = async (req, res) => {

    const idInsidencia = req.body.id.trim();

    const insidencia = await Insidencias.findOne({ where: { idInsidencia: idInsidencia }});

    const usuario = await Usuarios.findOne({ where: { id_usuario: insidencia.usuarioIdUsuario }});

    const plataforma = await Plataformas.findOne({ where: { id_plataforma: insidencia.plataformaIdPlataforma }});

    const valFoto = usuario.foto;

    if(valFoto === null) {
        var foto = '/assetsDashboard/img/users/default.jpg';
    } else {
        var foto = '/uploads/usuarios/'+valFoto;
    }

    res.json({ asunto: insidencia.asunto, descripcion: insidencia.descripcion, imagen: insidencia.imagen, fecha: insidencia.fecha, usuario: usuario.nombre, plataforma: plataforma.plataforma, perfil: usuario.perfil, foto: foto});
    return;

}

exports.insidencias = async (req, res) => {

    const insidenciaNoRespondidas = await Insidencias.findAll({
        where: {
            [Op.and]:[{ usuarioIdUsuario: req.user.id_usuario }]
        },
        order: [['fecha', 'DESC']]
    });

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});
    
    const plataformas = await Plataformas.findAll({ 
        where: {
            [Op.and]:[{id_superdistribuidor: superdistribuidor.id_usuario}, {estado:1}]
        }
    });

    res.json({ insidencias: insidenciaNoRespondidas, plataformas: plataformas, nombre: req.user.nombre});
    return;

}

exports.sinResponder = async (req, res) => {

    const insidenciaNoRespondidas = await Insidencias.findAll({
        where: {
            [Op.and]:[{ usuarioIdUsuario: req.user.id_usuario }, {estado:0}]
        },
        order: [['fecha', 'DESC']]
    });

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});
    
    const plataformas = await Plataformas.findAll({ 
        where: {
            [Op.and]:[{id_superdistribuidor: superdistribuidor.id_usuario}, {estado:1}]
        }
    });

    res.json({ insidencias: insidenciaNoRespondidas, plataformas: plataformas, nombre: req.user.nombre});
    return;

}

exports.respondidas = async (req, res) => {

    const insidenciaNoRespondidas = await Insidencias.findAll({
        where: {
            [Op.and]:[{ usuarioIdUsuario: req.user.id_usuario }, {estado:1}]
        },
        order: [['fecha', 'DESC']]
    });

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});
    
    const plataformas = await Plataformas.findAll({ 
        where: {
            [Op.and]:[{id_superdistribuidor: superdistribuidor.id_usuario}, {estado:1}]
        }
    });

    res.json({ insidencias: insidenciaNoRespondidas, plataformas: plataformas, nombre: req.user.nombre});
    return;

}