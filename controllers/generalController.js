const Usuarios = require('../models/UsuariosModelo');
const { Op } = require("sequelize");
const { body, validationResult } = require('express-validator');
const enviarEmails = require('../handlers/emails');
const axios = require('axios');
const { v4: uuid_v4 } = require('uuid');
const generator = require('generate-password');
const bcrypt = require('bcrypt-nodejs');

exports.inicio = (req, res) => {
    res.render('inicio', {
        nombrePagina: 'El mejor entretenimiento en linea'
    })
}

exports.formRegistro = (req, res) => {
    res.render('registro', {
        nombrePagina: 'Registro'
    })
}

exports.validarRegistro = async (req, res, next) => {
    // leer datos
    const usuario = req.body;

    const validacionEnlacePatrocinador = req.body.enlacePatrocinador.split('-');
    const perfilEnlace = validacionEnlacePatrocinador[validacionEnlacePatrocinador.length - 1];
    var enlPat2 = '';
    for (var i = 0; i < validacionEnlacePatrocinador.length - 1; i++) {
        enlPat2 += validacionEnlacePatrocinador[i] + '-';
    }

    const enlPat = enlPat2.substring(0, enlPat2.length - 1);

    // validar distribuidor
    const validarDistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: enlPat, bloqueo: 0 } });

    if (validarDistribuidor) {
        var validacionDist = validarDistribuidor.enlace_afiliado;
        var superPatrocinador = validarDistribuidor.super_patrocinador;
    } else {
        var validacionDist = 'no-coincide';
    }

    // Nueva validacion express validator

    const rules = [
        body('nombre').not().isEmpty().withMessage('El nombre es obligatorio').escape(),
        // body('perfil').not().isEmpty().withMessage('Debe seleccionar un perfil').escape(),
        body('direccion').not().isEmpty().withMessage('La dirección es obligatorio').escape(),
        body('telefono').not().isEmpty().withMessage('El teléfono es obligatorio').escape(),
        body('pais').not().isEmpty().withMessage('El pais es obligatorio').escape(),
        body('enlacePatrocinador').not().isEmpty().withMessage('El código de afiliación no puede ser vacio').escape(),
        body('email').isEmail().withMessage('El email es obligatorio').normalizeEmail({ "gmail_remove_dots": false }),
        body('password').not().isEmpty().withMessage('El password es obligatorio').escape(),
        body('password').not().isEmpty().isLength({ min: 10 }).withMessage('El password debe ser mayor a 10 caracteres').escape(),
        body('enlacePatrocinador').equals(validacionDist + '-' + perfilEnlace).withMessage('El código de afiliación no es valido')
    ];

    await Promise.all(rules.map(validation => validation.run(req)));

    const errores = validationResult(req);
    //si hay errores
    if (!errores.isEmpty()) {
        req.flash('danger', errores.array().map(error => error.msg));
        res.render('registro', {
            nombrePagina: 'Registro',
            mensajes: req.flash()
        })
        return;
    }

    const email = req.body.email;
    const userExist = await Usuarios.findOne({
        where: {
            email: email
        }
    });

    if (userExist) {
        req.flash('danger', 'El usuario ya se encuentra registrado en nuestra plataforma');
        return res.render('registro', {
            nombrePagina: 'Registro',
            mensajes: req.flash()
        })
    }

    //si toda la validacion es correcta
    next();

}

exports.crearRegistro = async (req, res) => {

    const validacionEnlacePatrocinador = req.body.enlacePatrocinador.split('-');
    const perfilEnlace = validacionEnlacePatrocinador[validacionEnlacePatrocinador.length - 1];
    var enlPat2 = '';
    for (var i = 0; i < validacionEnlacePatrocinador.length - 1; i++) {
        enlPat2 += validacionEnlacePatrocinador[i] + '-';
    }

    const enlPat = enlPat2.substring(0, enlPat2.length - 1);

    const datosRed = await Usuarios.findOne({ where: { enlace_afiliado: enlPat, bloqueo: 0 } });

    const usuario = req.body;
    const superPatrocinador = datosRed.super_patrocinador;
    const replacer = new RegExp(' ', 'g');
    const digito = Math.round(Math.random() * (999 - 0) + 0);
    const enlace = usuario.nombre.replace(replacer, '-').toLowerCase();
    const enlace_afiliado = enlace + '-' + digito;
    const response = await axios.get('https://api.ipify.org?format=json');
    const ip = response.data.ip;
    const observaciones = 'Usuario creado desde codigo afiliado';

    if (perfilEnlace === 'res21ok7') {
        var perfil = 'reseller';
    } else if (perfilEnlace === 'okdist21m') {
        var perfil = 'distribuidor';
    } else {
        req.flash('danger', 'El código de afiliación no es valido');
        res.redirect('/registro');
        return;
    }

    try {

        await Usuarios.create({
            nombre: usuario.nombre,
            email: usuario.email,
            password: usuario.password,
            enlace_afiliado: enlace_afiliado,
            pais: usuario.pais,
            direccion: usuario.direccion,
            telefono_movil: usuario.telefono,
            ip: ip,
            perfil: perfil,
            observaciones: observaciones,
            patrocinador: enlPat,
            super_patrocinador: superPatrocinador
        });

        // URL confirmacion
        const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`;

        // Enviar email
        await enviarEmails.enviarEmail({
            usuario,
            url,
            subject: 'Confirma tu cuenta de Full Entretenimiento',
            archivo: 'confirmar-cuenta'
        });

        // Todo: flash message y redireccionar
        req.flash('success', 'Te hemos enviado un E-mail para confirmar tu cuenta');
        res.redirect('/ingreso');
        // console.log('creando usuario');

    } catch (error) {

        console.log(error)
        const erroresSequelize = error.errors.map(err => err.message);

        req.flash('danger', erroresSequelize);
        res.redirect('/registro');
    }

}

exports.recuperarPasswords = async (req, res) => {

    const email = req.body.emailRecuperar.trim();

    const usuario = await Usuarios.findOne({ where: { email: email } });

    if (!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'El email ingresado no existe en nuestra base de datos.' });
        return;
    }

    // NewPassword
    const newPassword = generator.generate({
        length: 12,
        numbers: true
    });

    const hashPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10), null);

    usuario.password = hashPassword;
    await usuario.save();

    // Enviar email
    await enviarEmails.enviarEmailPassword({
        usuario: email,
        newPassword,
        subject: 'Recuperar contraseña Full Entretenimiento',
        archivo: 'recuperar-password'
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Te hemos enviado un E-mail para resstablecer tu contraseña.' });
    return;
}

// confirmar la cuenta del ususario

exports.confirmarCuenta = async (req, res, next) => {
    // verificar usuario existe
    const usuario = await Usuarios.findOne({ where: { email: req.params.correo } });

    // si no existe redireccionar
    if (!usuario) {
        req.flash('warning', 'El usuario ' + req.params.correo + ' no existe en nuestra plataforma');
        res.redirect('/registro');
        return next();
    }

    // si existe confirmar cuenta y redireccionar
    usuario.verificacion = 1;
    await usuario.save();

    req.flash('success', 'La cuenta se ha confirmado con éxito, ya puedes iniciar sesión');
    res.redirect('/ingreso');
}

exports.formIngreso = (req, res) => {
    res.render('ingreso', {
        nombrePagina: 'Ingreso'
    })
}