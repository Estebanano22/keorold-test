const Usuarios = require('../models/UsuariosModelo');
const LinksPse = require('../models/linksPseModelo');
const { Op } = require("sequelize");
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');

exports.linkPse = async (req, res) => {

    const linksPse = await LinksPse.findAll({
        where: {
            [Op.and]: [{usuarioIdUsuario: req.user.id_usuario}]
        },
        order: [['fecha', 'DESC']]
    });

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});

    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});

    res.render('dashboard/linkPse', {
        nombrePagina : 'Solicitar link PSE',
        titulo: 'Solicitar link PSE',
        breadcrumb: 'Solicitar link PSE',
        classActive: req.path.split('/')[2],
        usuario,
        linksPse
    })

}

exports.solicitarLink = async (req, res) => {

    const valor = req.body.valor;
    
    if(valor === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Por favor llene todos los campos.' });
        return;
    }

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});

    await LinksPse.create({
        idLink: uuid_v4(),
        idSuperdistribuidor: superdistribuidor.id_usuario,
        valor: valor,
        estado: 0,
        usuarioIdUsuario: req.user.id_usuario,
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Link PSE solicitado con exito con éxito.' });
    return;

}