const Usuarios = require('../models/UsuariosModelo');
const Plataformas = require('../models/plataformasModelo');
const Cuentas = require('../models/cuentasModelo');
const { Op } = require("sequelize");
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');
const fs = require('fs');
const xlsx = require('node-xlsx');

// Inicio
exports.subirCuentas = async (req, res) => {
    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});
    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador }});
    const usuarios = await Usuarios.findAll({
        where: { patrocinador: req.user.enlace_afiliado }
    });

    const plataformas = await Plataformas.findAll({
        where: {
            [Op.and]: [{id_superdistribuidor: superdistribuidor.id_usuario}, { estado: 1 }, { tipo_plataforma: 1 }]
        },
        order: [['plataforma', 'DESC']]
    });

    const cuentas = await Cuentas.findAll({
        where: {
            [Op.and]: [{idSuperdistribuidor: superdistribuidor.id_usuario}, {tipoCuenta: 1}]
        },
        order: [['fechaSubida', 'DESC']]
    });

    const cuentasTomadas = await Cuentas.findAll({
        where: {
            [Op.and]: [{idSuperdistribuidor: superdistribuidor.id_usuario}, {tipoCuenta: 1}, {estado: 1}]
        },
        order: [['fechaSubida', 'DESC']]
    });

    const cuentasSinTomar = await Cuentas.findAll({
        where: {
            [Op.and]: [{idSuperdistribuidor: superdistribuidor.id_usuario}, {tipoCuenta: 1}, {estado: 0}]
        },
        order: [['fechaSubida', 'DESC']]
    });

    res.render('dashboard/subirCuentas', {
        nombrePagina : 'Subir cuentas',
        titulo: 'Subir cuentas',
        breadcrumb: 'Subir cuentas',
        classActive: req.path.split('/')[2],
        usuario,
        usuarios,
        plataformas,
        cuentas,
        cuentasTomadas,
        cuentasSinTomar
    })
}

const configuracionMulter = {
    storage: fileStorage = multer.diskStorage({
        destination: (req, res, next) => {
            next(null, __dirname+'/../public/uploads/assets/');
        },
        filename: (req, file, next) => {
            const extencion = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.xlsx`);
        }
    })
};

const upload = multer(configuracionMulter).single('files');

exports.uploadExcel = async (req, res, next) => {
    
    upload(req, res, function(error) {
        if(error){
            res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Hubo un error con el archivo que desea subir.' });
            return;
        } else {
            next();
        }
    })
}

exports.subirCuentasExcel = async (req, res) => {
    const nombreArchivo = req.file.filename;
    const obj = xlsx.parse(fs.readFileSync(__dirname+'/../public/uploads/assets/'+nombreArchivo));

    obj.forEach(async(i) => {
        const fila = i.data;
        
        for(var i = 0; i < fila.length; i++) {
            const usuario = fila[i][0];
            const contrasena = fila[i][1];
            const pantalla = fila[i][2];
            const pin = fila[i][3];

            if(usuario === undefined || contrasena === undefined || pantalla === undefined || pin === undefined) {
                res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible subir el archivo con las cuentas, debido a que hay una columna vacia. Recuerde que las columnas deben ser enviadas en formato "General" de la siguiente Manera: (A) Usuario, (B) Contraseña, (C) Pantalla, (D) Pin; En caso de no requerirse la columna C y D por favor llenar en el Excel con "no aplica."' });
                return;
                break;
            }

            const id_plataforma = req.body.plataforma;
            const idSuperdistribuidor = req.user.id_usuario;
            const tipoCuenta = 1;


            try {
        
                await Cuentas.create({
                    idCuenta: uuid_v4(),
                    idSuperdistribuidor: idSuperdistribuidor,
                    user: usuario,
                    password: contrasena,
                    pantalla: pantalla,
                    pin: pin,
                    plataformaIdPlataforma: id_plataforma,
                    tipoCuenta: tipoCuenta
                });
        
            } catch (error) {
                console.log(error);
                res.json({ titulo: '¡Lo sentimos!', resp: 'error', descripcion: error.message });
                return;
                break;
            }

        }

    })

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'El archivo con las cuentas se ha subido en su totalidad con éxito.' });
    return;
}

exports.editarCuenta = async (req, res) => {

    const idCuenta = req.body.id.trim();
    const userCuenta = req.body.usuario.trim();
    const passwordCuenta = req.body.password.trim();
    const pantallaCuenta = req.body.pantalla.trim();
    const pinCuenta = req.body.pin.trim();

    const cuenta = await Cuentas.findOne({ where: { idCuenta: idCuenta }});

    if(userCuenta === '' || passwordCuenta === '' || pantallaCuenta === '' || pinCuenta === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No debe haber campos vacios.' });
        return; 
    }

    if(!cuenta) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible editar la cuenta.' });
        return;
    }

    cuenta.user = userCuenta;
    cuenta.password = passwordCuenta;
    cuenta.pantalla = pantallaCuenta;
    cuenta.pin = pinCuenta;

    await cuenta.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Cuenta editada con éxito.' });
    return;

}

exports.eliminarCuenta = async (req, res) => {

    const id = req.body.id.trim();

    const cuenta = await Cuentas.findOne({ where: { idCuenta: id }});

    if(!cuenta) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible eliminar la cuenta.' });
        return;
    }

    await Cuentas.destroy({ where: { idCuenta: id }});

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Cuenta eliminada con éxito.' });
    return;

}

exports.cuentasSinTomar = async (req, res)  => {

    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});

    const plataformas = await Plataformas.findAll({
        where: {
            [Op.and]: [{id_superdistribuidor: req.user.id_usuario}, { estado: 1 }]
        },
        order: [['tipo_plataforma', 'ASC']]
    });

    const cuentas = await Cuentas.findAll({
        where: {
            [Op.and]: [{idSuperdistribuidor: req.user.id_usuario}]
        },
        order: [['fechaSubida', 'DESC']]
    });

    const cuentasSinTomar = await Cuentas.findAll({
        where: {
            [Op.and]: [{idSuperdistribuidor: req.user.id_usuario}, {estado: 0}]
        },
        order: [['fechaSubida', 'DESC']]
    });

    res.render('dashboard/cuentasSinTomar', {
        nombrePagina : 'Cuentas Sin Tomar',
        titulo: 'Cuentas Sin Tomar',
        breadcrumb: 'Cuentas Sin Tomar',
        classActive: req.path.split('/')[2],
        usuario,
        plataformas,
        cuentas,
        cuentasSinTomar
    })

}