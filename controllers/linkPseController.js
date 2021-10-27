const Usuarios = require('../models/UsuariosModelo');
const LinksPse = require('../models/linksPseModelo');
const { Op } = require("sequelize");
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');

exports.linkPse = async (req, res) => {

    const linksPse = await LinksPse.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        order: [['fecha', 'DESC']]
    });

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador } });

    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario } });

    res.render('dashboard/linkPse', {
        nombrePagina: 'Solicitar link de pago',
        titulo: 'Solicitar link de pago',
        breadcrumb: 'Solicitar link de pago',
        classActive: req.path.split('/')[2],
        usuario,
        linksPse
    })

}

exports.solicitarLink = async (req, res) => {

    const valor = req.body.valor;

    if (valor === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Por favor llene todos los campos.' });
        return;
    }

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador } });

    await LinksPse.create({
        idLink: uuid_v4(),
        idSuperdistribuidor: superdistribuidor.id_usuario,
        valor: valor,
        estado: 0,
        usuarioIdUsuario: req.user.id_usuario,
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Link de pago solicitado con exito con éxito.' });
    return;

}

exports.adminLinksPse = async (req, res) => {

    const linksPse = await LinksPse.findAll({
        where: {
            [Op.and]: [{ idSuperdistribuidor: req.user.id_usuario }]
        },
        include: [
            { model: Usuarios, foreignKey: 'usuarioIdUsuario' }
        ],
        order: [['fecha', 'DESC']]
    });

    const countLinks = await LinksPse.count({
        where: {
            [Op.and]: [{ idSuperdistribuidor: req.user.id_usuario }, { estado: 0 }]
        }
    })

    res.render('dashboard/adminLinksPse', {
        nombrePagina: 'Administrar link de pago',
        titulo: 'Administrar link de pago',
        breadcrumb: 'Administrar link de pago',
        classActive: req.path.split('/')[2],
        linksPse,
        countLinks
    })

}

exports.asignarLink = async (req, res) => {

    const link = req.body.link;
    const id = req.body.id;


    if (link === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Por favor ingrese un link valido.' });
        return;
    }

    const linkPse = await LinksPse.findOne({
        where: {
            idLink: id
        }
    });

    if (!linkPse) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible asignar un Link de pago a esta solicitud ya que no existe.' });
        return;
    }

    linkPse.link = link;
    linkPse.estado = 1;
    await linkPse.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'El link de pago ha sido asignado con éxito.' });
    return;

}

exports.editarLink = async (req, res) => {

    const link = req.body.link;
    const id = req.body.id;


    if (link === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Por favor ingrese un link valido.' });
        return;
    }

    const linkPse = await LinksPse.findOne({
        where: {
            idLink: id
        }
    });

    if (!linkPse) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible asignar un Link de pago a esta solicitud ya que no existe.' });
        return;
    }

    linkPse.link = link;
    await linkPse.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'El link de pago ha sido editado con éxito.' });
    return;

}

exports.eliminarLink = async (req, res) => {

    const id = req.body.id.trim();

    const linkPse = await LinksPse.findOne({ where: { idLink: id } });

    if (!linkPse) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible eliminar el link.' });
        return;
    }

    await linkPse.destroy({ where: { idLink: id } });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Link de pago eliminado con éxito.' });
    return;

}