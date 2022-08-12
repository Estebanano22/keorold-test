const Usuarios = require('../models/usuariosModelo');
const Plataformas = require('../models/plataformasModelo');
const Asignaciones = require('../models/asignacionesModelo');
const Cuentas = require('../models/cuentasModelo');
const Ganancias = require('../models/gananciasModelo');
const Cargas = require('../models/cargasModelo');
const { Op } = require("sequelize");
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');

// Inicio
exports.plataformas = async (req, res) => {
    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario } });
    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador } });
    const usuarios = await Usuarios.findAll({
        where: { patrocinador: req.user.enlace_afiliado }
    });

    let plataformas = await Plataformas.findAll({
        where: {
            [Op.and]: [{ id_superdistribuidor: superdistribuidor.id_usuario }, { estado: 1 }]
        },
        order: [['plataforma', 'DESC']]
    });

    let plataformasNormales = await Asignaciones.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        include: [
            {
                model: Plataformas, foreignKey: 'plataformaIdPlataforma',
                where: {
                    [Op.and]: [{ estado: 1 }, { tipo_plataforma: 1 }]
                }
            },
        ],
        order: [
            [{
                model: Plataformas,
                foreignKey: 'plataformaIdPlataforma'
            },
            'plataforma','ASC'
            ]
        ]
    });

    let plataformasBajoPedido = await Asignaciones.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        include: [
            {
                model: Plataformas, foreignKey: 'plataformaIdPlataforma',
                where: {
                    [Op.and]: [{ estado: 1 }, { tipo_plataforma: 2 }]
                }
            },
        ],
        order: [
            [{
                model: Plataformas,
                foreignKey: 'plataformaIdPlataforma'
            },
            'plataforma','ASC'
            ]
        ]

    });

    let plataformasPersonalizadas = await Asignaciones.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        include: [
            {
                model: Plataformas, foreignKey: 'plataformaIdPlataforma',
                where: {
                    [Op.and]: [{ estado: 1 }, { tipo_plataforma: 3 }]
                }
            },
        ],
        order: [
            [{
                model: Plataformas,
                foreignKey: 'plataformaIdPlataforma'
            },
            'plataforma','ASC'
            ]
        ]
        // order: [['plataforma', 'DESC']]
    });

    let plataformasRenovaciones = await Asignaciones.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        include: [
            {
                model: Plataformas, foreignKey: 'plataformaIdPlataforma',
                where: {
                    [Op.and]: [{ estado: 1 }, { tipo_plataforma: 4 }]
                }
            },
        ],
        order: [
            [{
                model: Plataformas,
                foreignKey: 'plataformaIdPlataforma'
            },
            'plataforma','ASC'
            ]
        ]
        // order: [['plataforma', 'DESC']]
    });

    let plataformasJuegos = await Asignaciones.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        include: [
            {
                model: Plataformas, foreignKey: 'plataformaIdPlataforma',
                where: {
                    [Op.and]: [{ estado: 1 }, { tipo_plataforma: 5 }]
                }
            },
        ],
        // order: [['plataforma', 'DESC']]
        order: [
            [{
                model: Plataformas,
                foreignKey: 'plataformaIdPlataforma'
            },
            'plataforma','ASC'
            ]
        ]
    });

    let asignaciones = await Asignaciones.findAll({
        where: { usuarioIdUsuario: req.user.id_usuario }
    })

    let cuentas = await Cuentas.findAll({
        where: {
            [Op.and]: [{ estado: 0 }, { idSuperdistribuidor: superdistribuidor.id_usuario }]
        }
    })

    res.render('dashboard/plataformas', {
        nombrePagina: 'Comprar cuentas',
        titulo: 'Comprar cuentas',
        breadcrumb: 'Comprar cuentas',
        classActive: req.path.split('/')[2],
        usuario,
        usuarios,
        plataformas,
        plataformasNormales,
        plataformasBajoPedido,
        plataformasPersonalizadas,
        plataformasRenovaciones,
        plataformasJuegos,
        asignaciones,
        cuentas
    })
}

//busqueda plataformas
exports.plataformasBusqueda = async (req, res) => {

    const datos = req.body.busquedaInput;
    
    const busquedas = await Asignaciones.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        include: [
            {
                model: Plataformas, foreignKey: 'plataformaIdPlataforma',
                where: {
                    [Op.and]: [{ estado: 1 }, {plataforma: {[Op.like]: `%${datos}%`}}]
                }
            },
            {
                model: Usuarios, foreignKey: 'usuarioIdUsuario'
            }
        ],
        order: [
            [{
                model: Plataformas,
                foreignKey: 'plataformaIdPlataforma'
            },
            'plataforma','ASC'
            ]
        ]
    });

    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]:[{id_usuario: req.user.id_usuario}]
        }
    });

    res.json({ busquedas, usuario })
    
}

exports.compraCuentaNormal = async (req, res) => {

    const plataforma = await Plataformas.findOne({
        where: {
            [Op.and]: [{ id_plataforma: req.body.id }]
        }
    });

    const cuenta = await Cuentas.findOne({
        where: {
            [Op.and]: [{ plataformaIdPlataforma: req.body.id }, { estado: 0 }, { tipoCuenta: 1 }]
        },
        order: [['fechaSubida', 'ASC']]
    });

    const asignacionUsuario = await Asignaciones.findOne({
        where: {
            [Op.and]: [{ plataformaIdPlataforma: req.body.id }, { usuarioIdUsuario: req.user.id_usuario }]
        }
    });
    // console.log(asignacionUsuario.valor);
    // console.log(req.user.saldo);

    if (Number(asignacionUsuario.valor) > Number(req.user.saldo)) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible generar una cuenta de esta plataforma en este momento, debido a que su saldo no es suficiente.' });
        return;
    }

    if (!cuenta) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible generar una cuenta de esta plataforma en este momento.' });
        return;
    }

    const telefonoCliente = req.body.telefono;
    const nombreCliente = req.body.cliente.trim();

    if (telefonoCliente === '' || nombreCliente === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debes llenar todos los campos y autorizar el envio de datos.' });
        return;
    }

    // Restar Saldo del usuario
    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: req.user.id_usuario }, { bloqueo: 0 }]
        }
    });

    //super distribuidor
    const superDistribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.super_patrocinador }]
        }
    });
    
    //distribuidor
    const distribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.patrocinador }]
        }
    });

    //distribuidor2
    const distribuidor2 = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: distribuidor.patrocinador }]
        }
    });

    //distribuidor3
    const distribuidor3 = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: distribuidor2.patrocinador }]
        }
    });
    
    //distribuidor4
    const distribuidor4 = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: distribuidor3.patrocinador }]
        }
    });

    if (!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible solicitar la cuenta debido a que el usuario no no existe o se encuentra bloqueado.' });
        return;
    }

    usuario.saldo = Number(usuario.saldo) - Number(asignacionUsuario.valor);
    await usuario.save();

    const nombrePlataforma = plataforma.plataforma.toLowerCase();

    // si es magis asigna el 20% al usuario
    
    const porcentaje0 = Number(asignacionUsuario.valor) * 0.35;

    const usuario0 = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: req.user.id_usuario }, { bloqueo: 0 }]
        }
    });
 
    if (nombrePlataforma.includes('magistv')) {

        // Crear ganancia en tabla
        await Cargas.create({
            idCarga: uuid_v4(),
            idSuperdistribuidor: superDistribuidor.id_usuario,
            valor: porcentaje0,
            accionCarga: 'carga',
            tipoCarga: 'Reintegro',
            saldoAnterior: usuario0.saldo,
            saldoNuevo: Number(usuario0.saldo) + Number(porcentaje0),
            usuarioIdUsuario: req.user.id_usuario,
            responsableGestion: 'Sistema'
        });

        usuario0.saldo = Number(usuario0.saldo) + Number(porcentaje0);
        await usuario0.save();

    }

    //--------------------------------------------------------//
    //         Ganancia Distribuidor 1er Nivel                //
    //--------------------------------------------------------//

    //Generar Ganancia Disitribuidor

        const asignacionDistribuidor = await Asignaciones.findOne({
            where: {
                [Op.and]: [{ plataformaIdPlataforma: req.body.id }, { usuarioIdUsuario: distribuidor.id_usuario }]
            }
        });
    
        const valorDistribuidor = Number(asignacionDistribuidor.valor);
        const valorUsuario = Number(asignacionUsuario.valor);
        const gananciaDistribuidor = valorUsuario - valorDistribuidor;
    
        // Ganancias Distribuidor Saldo
        distribuidor.saldo = Number(distribuidor.saldo) + Number(gananciaDistribuidor);
        await distribuidor.save();
    
        // Crear ganancia en tabla
        Ganancias.create({
            idGanancia: uuid_v4(),
            ganancia: gananciaDistribuidor,
            distribuidor: distribuidor.id_usuario,
            usuarioIdUsuario: req.user.id_usuario,
            plataformaIdPlataforma: req.body.id
        });
    
        // si es magis asigna el 4% al usuario
        
        const porcentaje1 = Number(asignacionUsuario.valor) * 0.033;
    
        const usuario1 = await Usuarios.findOne({
            where: {
                [Op.and]: [{ id_usuario: distribuidor.id_usuario }, { bloqueo: 0 }]
            }
        });
     
        if (nombrePlataforma.includes('magistv')) {
    
            // Crear ganancia en tabla
            await Cargas.create({
                idCarga: uuid_v4(),
                idSuperdistribuidor: superDistribuidor.id_usuario,
                valor: porcentaje1,
                accionCarga: 'carga',
                tipoCarga: 'Reintegro',
                saldoAnterior: usuario1.saldo,
                saldoNuevo: Number(usuario1.saldo) + Number(porcentaje1),
                usuarioIdUsuario: usuario1.id_usuario,
                responsableGestion: 'Sistema'
            });
    
            usuario1.saldo = Number(usuario1.saldo) + Number(porcentaje1);
            await usuario1.save();
    
        }

    //--------------------------------------------------------//

    //--------------------------------------------------------//
    //         Ganancia Distribuidor 2do Nivel                //
    //--------------------------------------------------------//

    //Generar Ganancia Disitribuidor

        const asignacionDistribuidor2 = await Asignaciones.findOne({
            where: {
                [Op.and]: [{ plataformaIdPlataforma: req.body.id }, { usuarioIdUsuario: distribuidor2.id_usuario }]
            }
        });
    
        if (asignacionDistribuidor2) {
    
            var valorDistribuidor1 = Number(asignacionDistribuidor.valor);
            var valorDistribuidor2 = Number(asignacionDistribuidor2.valor);
            var gananciaDistribuidor2 = valorDistribuidor1 - valorDistribuidor2;
    
            // Ganancias Distribuidor Saldo
            distribuidor2.saldo = Number(distribuidor2.saldo) + Number(gananciaDistribuidor2);
            await distribuidor2.save();
    
            // Crear ganancia en tabla
            Ganancias.create({
                idGanancia: uuid_v4(),
                ganancia: gananciaDistribuidor2,
                distribuidor: distribuidor2.id_usuario,
                usuarioIdUsuario: req.user.id_usuario,
                plataformaIdPlataforma: req.body.id
            });
    
        }
    
        // si es magis asigna el 3% al usuario
        
        const porcentaje2 = Number(asignacionUsuario.valor) * 0.033;
    
        const usuario2 = await Usuarios.findOne({
            where: {
                [Op.and]: [{ id_usuario: distribuidor2.id_usuario }, { bloqueo: 0 }]
            }
        });
     
        if (nombrePlataforma.includes('magistv')) {
    
            // Crear ganancia en tabla
            await Cargas.create({
                idCarga: uuid_v4(),
                idSuperdistribuidor: superDistribuidor.id_usuario,
                valor: porcentaje2,
                accionCarga: 'carga',
                tipoCarga: 'Reintegro',
                saldoAnterior: usuario2.saldo,
                saldoNuevo: Number(usuario2.saldo) + Number(porcentaje2),
                usuarioIdUsuario: usuario2.id_usuario,
                responsableGestion: 'Sistema'
            });
    
            usuario2.saldo = Number(usuario2.saldo) + Number(porcentaje2);
            await usuario2.save();
    
        }

    //--------------------------------------------------------//

    //--------------------------------------------------------//
    //         Ganancia Distribuidor 3er Nivel                //
    //--------------------------------------------------------//

    //Generar Ganancia Disitribuidor

        const asignacionDistribuidor3 = await Asignaciones.findOne({
            where: {
                [Op.and]: [{ plataformaIdPlataforma: req.body.id }, { usuarioIdUsuario: distribuidor3.id_usuario }]
            }
        });
    
        if (asignacionDistribuidor3) {
    
            var valorDistribuidor3 = Number(asignacionDistribuidor3.valor);
            var valorDistribuidor2_3 = Number(asignacionDistribuidor2.valor);
            var gananciaDistribuidor3 = valorDistribuidor2_3 - valorDistribuidor3;
    
            // Ganancias Distribuidor Saldo
            distribuidor3.saldo = Number(distribuidor3.saldo) + Number(gananciaDistribuidor3);
            await distribuidor3.save();
    
            // Crear ganancia en tabla
            Ganancias.create({
                idGanancia: uuid_v4(),
                ganancia: gananciaDistribuidor3,
                distribuidor: distribuidor3.id_usuario,
                usuarioIdUsuario: req.user.id_usuario,
                plataformaIdPlataforma: req.body.id
            });
    
        }
    
        // si es magis asigna el 3% al usuario
        
        const porcentaje3 = Number(asignacionUsuario.valor) * 0.033;
    
        const usuario3 = await Usuarios.findOne({
            where: {
                [Op.and]: [{ id_usuario: distribuidor3.id_usuario }, { bloqueo: 0 }]
            }
        });
     
        if (nombrePlataforma.includes('magistv')) {
    
            // Crear ganancia en tabla
            await Cargas.create({
                idCarga: uuid_v4(),
                idSuperdistribuidor: superDistribuidor.id_usuario,
                valor: porcentaje3,
                accionCarga: 'carga',
                tipoCarga: 'Reintegro',
                saldoAnterior: usuario3.saldo,
                saldoNuevo: Number(usuario3.saldo) + Number(porcentaje3),
                usuarioIdUsuario: usuario3.id_usuario,
                responsableGestion: 'Sistema'
            });
    
            usuario3.saldo = Number(usuario3.saldo) + Number(porcentaje3);
            await usuario3.save();
    
        }

    //--------------------------------------------------------//

    // console.log(gananciaDistribuidor != undefined ? 'Distribuidor Nivel 1: '+ gananciaDistribuidor : 'no existe');
    // console.log(gananciaDistribuidor2 != undefined ?'Distribuidor Nivel 2: '+ gananciaDistribuidor2 : 'no existe');
    // console.log(gananciaDistribuidor3 != undefined ?'Distribuidor Nivel 3: '+ gananciaDistribuidor3 : 'no existe');

    // Actualizar cuenta
    cuenta.idDistribuidor = distribuidor.id_usuario;
    cuenta.estado = 1;
    cuenta.cliente = nombreCliente;
    cuenta.telefono = telefonoCliente;
    cuenta.fechaCompra = new Date();
    cuenta.usuarioIdUsuario = req.user.id_usuario;
    cuenta.valorPagado = valorUsuario;
    await cuenta.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Cuenta comprada con éxito.', user: cuenta.user, password: cuenta.password, pantalla: cuenta.pantalla, pin: cuenta.pin, logo: plataforma.logo, plataforma: plataforma.plataforma, telefono: telefonoCliente, cliente: nombreCliente });
    return;

}


exports.compraCuentaPedido = async (req, res) => {

    const telefonoCliente = req.body.telefono;
    const nombreCliente = req.body.cliente.trim();

    const plat = await Plataformas.findOne({
        where: {
            [Op.and]: [{id_plataforma: req.body.id}]
        }
    })

    const nombrePlataforma = plat.plataforma.toLowerCase();

    if (nombrePlataforma.includes('demo')) {
        if (req.user.pais === 'Colombia') {
            if (Number(req.user.saldo) < 15000) {
                res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Usted no cuenta con saldo suficiente para solicitar demos, recuerde que el saldo minimo es $ 15.000 COP.' });
                return;
            }
        } else {
            if (Number(req.user.saldo) < 8) {
                res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Usted no cuenta con saldo suficiente para solicitar demos, recuerde que el saldo minimo es $ 8 USD.' });
                return;
            }
        }
    }

    if (telefonoCliente === '' || nombreCliente === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debes llenar todos los campos y autorizar el envio de datos.' });
        return;
    }

    // Restar Saldo del usuario
    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: req.user.id_usuario }, { bloqueo: 0 }]
        }
    });

    if (!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible solicitar la cuenta debido a que el usuario no existe o se encuentra bloqueado.' });
        return;
    }

    const distribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.patrocinador }]
        }
    });

    const superDistribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.super_patrocinador }]
        }
    });

    // Crear la renovación de la cuenta
    Cuentas.create({
        idCuenta: uuid_v4(),
        idDistribuidor: distribuidor.id_usuario,
        idSuperdistribuidor: superDistribuidor.id_usuario,
        estado: 0,
        tipoCuenta: 2,
        cliente: nombreCliente,
        telefono: telefonoCliente,
        fechaSubida: new Date(),
        usuarioIdUsuario: req.user.id_usuario,
        plataformaIdPlataforma: req.body.id
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Cuenta solicitada con éxito.' });
    return;

}

exports.compraCuentaPersonalizada = async (req, res) => {

    const telefonoCliente = req.body.telefono;
    const nombreCliente = req.body.cliente.trim();
    const usuarioPersonalizada = req.body.usuarioPersonalizada.trim();
    const passwordPersonalizada = req.body.passwordPersonalizada.trim();

    if (telefonoCliente === '' || nombreCliente === '' || usuarioPersonalizada === '' || passwordPersonalizada === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debes llenar todos los campos y autorizar el envio de datos.' });
        return;
    }

    // Restar Saldo del usuario
    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: req.user.id_usuario }, { bloqueo: 0 }]
        }
    });

    if (!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible solicitar la personalización de la cuenta debido a que el usuario no existe o se encuentra bloqueado.' });
        return;
    }

    const distribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.patrocinador }]
        }
    });

    const superDistribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.super_patrocinador }]
        }
    });

    // Crear la solicitud de la cuenta
    Cuentas.create({
        idCuenta: uuid_v4(),
        idDistribuidor: distribuidor.id_usuario,
        idSuperdistribuidor: superDistribuidor.id_usuario,
        estado: 0,
        tipoCuenta: 3,
        cliente: nombreCliente,
        telefono: telefonoCliente,
        fechaSubida: new Date(),
        usuarioIdUsuario: req.user.id_usuario,
        plataformaIdPlataforma: req.body.id,
        user: usuarioPersonalizada,
        password: passwordPersonalizada
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Personalización en proceso.' });
    return;

}

exports.compraCuentaRenovacion = async (req, res) => {

    const telefonoCliente = req.body.telefono;
    const nombreCliente = req.body.cliente.trim();
    const usuarioRenovacion = req.body.usuarioRenovacion.trim();
    const passwordRenovacion = req.body.passwordRenovacion.trim();

    if (telefonoCliente === '' || nombreCliente === '' || usuarioRenovacion === '' || passwordRenovacion === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debes llenar todos los campos y autorizar el envio de datos.' });
        return;
    }

    // Restar Saldo del usuario
    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: req.user.id_usuario }, { bloqueo: 0 }]
        }
    });

    if (!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible solicitar la renovación debido a que el usuario no existe o se encuentra bloqueado.' });
        return;
    }

    const distribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.patrocinador }]
        }
    });

    const superDistribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.super_patrocinador }]
        }
    });

    // Crear la solicitud de la cuenta
    Cuentas.create({
        idCuenta: uuid_v4(),
        idDistribuidor: distribuidor.id_usuario,
        idSuperdistribuidor: superDistribuidor.id_usuario,
        estado: 0,
        tipoCuenta: 4,
        cliente: nombreCliente,
        telefono: telefonoCliente,
        fechaSubida: new Date(),
        usuarioIdUsuario: req.user.id_usuario,
        plataformaIdPlataforma: req.body.id,
        user: usuarioRenovacion,
        password: passwordRenovacion
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Renovación solicitada con éxito.' });
    return;

}

exports.compraCuentaFreefire = async (req, res) => {

    const telefonoCliente = req.body.telefono;
    const nombreCliente = req.body.cliente.trim();
    const idFreefire = req.body.idFreefire.trim();

    if (telefonoCliente === '' || nombreCliente === '' || idFreefire === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debes llenar todos los campos y autorizar el envio de datos.' });
        return;
    }

    // Restar Saldo del usuario
    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: req.user.id_usuario }, { bloqueo: 0 }]
        }
    });

    if (!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible generar la compra en Freefire debido a que el usuario no existe o se encuentra bloqueado en nuestra plataforma.' });
        return;
    }

    const distribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.patrocinador }]
        }
    });

    const superDistribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.super_patrocinador }]
        }
    });

    // Crear la solicitud de la cuenta
    Cuentas.create({
        idCuenta: uuid_v4(),
        idDistribuidor: distribuidor.id_usuario,
        idSuperdistribuidor: superDistribuidor.id_usuario,
        estado: 0,
        tipoCuenta: 5,
        cliente: nombreCliente,
        telefono: telefonoCliente,
        fechaSubida: new Date(),
        usuarioIdUsuario: req.user.id_usuario,
        plataformaIdPlataforma: req.body.id,
        idJuego: idFreefire
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Tu compra de Freefire se esta procesando con éxito.' });
    return;

}


exports.compraCuentaCallofduty = async (req, res) => {

    const telefonoCliente = req.body.telefono;
    const nombreCliente = req.body.cliente.trim();
    const usFacebook = req.body.usFacebook.trim();
    const psFacebook = req.body.psFacebook.trim();

    if (telefonoCliente === '' || nombreCliente === '' || psFacebook === '' || usFacebook === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debes llenar todos los campos y autorizar el envio de datos.' });
        return;
    }

    // Restar Saldo del usuario
    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: req.user.id_usuario }, { bloqueo: 0 }]
        }
    });

    if (!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible generar la compra en Call of duty debido a que el usuario no existe o se encuentra bloqueado en nuestra plataforma.' });
        return;
    }

    const distribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.patrocinador }]
        }
    });

    const superDistribuidor = await Usuarios.findOne({
        where: {
            [Op.and]: [{ enlace_afiliado: req.user.super_patrocinador }]
        }
    });

    // Crear la solicitud de la cuenta
    Cuentas.create({
        idCuenta: uuid_v4(),
        idDistribuidor: distribuidor.id_usuario,
        idSuperdistribuidor: superDistribuidor.id_usuario,
        estado: 0,
        tipoCuenta: 5,
        cliente: nombreCliente,
        telefono: telefonoCliente,
        fechaSubida: new Date(),
        usuarioIdUsuario: req.user.id_usuario,
        plataformaIdPlataforma: req.body.id,
        user: usFacebook,
        password: psFacebook
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Tu compra de Call of dutty se esta procesando con éxito.' });
    return;

}
