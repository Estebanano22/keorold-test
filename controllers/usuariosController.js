const Usuarios = require('../models/UsuariosModelo');
const Plataformas = require('../models/plataformasModelo');
const Asignaciones = require('../models/asignacionesModelo');
const Cargas = require('../models/cargasModelo');
const { Op } = require("sequelize");
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');

// Inicio
exports.adminUsuarios = async (req, res) => {
    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});
    const usuarios = await Usuarios.findAll();
    const plataformas = await Plataformas.findAll();

    // const plataformas = await Plataformas.findAll({
    //     include: [
    //         { 
    //             model: Asignaciones,
    //             where: { 
    //                 [Op.and]: [{ usuarioIdUsuario: id_usuario }, {plataformaIdPlataforma: {$col: 'Plataformas.id_plataforma'}}],
    //             }
    //         }
    //     ]
    // });

    res.render('dashboard/adminUsuarios', {
        nombrePagina : 'Administrador Usuarios',
        titulo: 'Administrador Usuarios',
        breadcrumb: 'Administrador Usuarios',
        classActive: req.path.split('/')[2],
        usuario,
        usuarios,
        plataformas
    })
}

exports.cambioPerfil = async (req, res) => {
    const id_usuario = req.body.id.trim();
    const perfil_usuario = req.body.perfil.trim();

    const usuario = await Usuarios.findOne({ where: { id_usuario: id_usuario }});

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible actualizar el perfil del usuario.' });
        return;
    }

    // si existe confirmar cuenta y redireccionar
    usuario.perfil = perfil_usuario;
    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Perfil actualizado con éxito.' });
    return;
}

exports.bloqueoUsuario = async (req, res) => {

    const id_usuario = req.body.id.trim();

    const usuario = await Usuarios.findOne({ where: { id_usuario: id_usuario }});

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible bloquear el usuario.' });
        return;
    }

    if(usuario.bloqueo === 1) {
        var bloqueo = 0;
        var descripcion = 'Usuario desbloqueado con éxito.';
    } else {
        var bloqueo = 1;
        var descripcion = 'Usuario bloqueado con éxito.';
    }

    // si existe confirmar cuenta y redireccionar
    usuario.bloqueo = bloqueo;
    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: descripcion });
    return;
    
}

exports.editarUsuario = async (req, res) => {

    const id_usuario = req.body.id.trim();
    const nombre = req.body.nombre.trim();
    const email = req.body.email.trim();
    const direccion = req.body.direccion.trim();
    const telefono = req.body.telefono.trim();
    const pais = req.body.pais.trim();

    const usuario = await Usuarios.findOne({ where: { id_usuario: id_usuario }});

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible editar el usuario.' });
        return;
    }

    usuario.email = email;
    usuario.nombre = nombre;
    usuario.direccion = direccion;
    usuario.telefono_movil = telefono;
    usuario.pais = pais;

    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Usuario editado con éxito.' });
    return;

}

exports.eliminarUsuario = async (req, res) => {

    const id_usuario = req.body.id.trim();

    const usuario = await Usuarios.findOne({ where: { id_usuario: id_usuario }});

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible eliminar el usuario.' });
        return;
    }

    await Usuarios.destroy({ where: { id_usuario: id_usuario }});

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Usuario eliminado con éxito.' });
    return;

}

exports.asignarPlataformaSuperdistribuidor = async (req, res) => {

    const id_usuario = req.body.id.trim();
    const objetoAsignaciones = req.body.asignaciones;

    if(objetoAsignaciones === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible asignar las plataformas, debe ingresar algún valor en las casillas.' });
        return;
    }

    // datos del usuario a asignar
    const usuario = await Usuarios.findOne({ 
        where: { 
            [Op.and]: [{ id_usuario: id_usuario }, { bloqueo: 0 }], 
        },
        attributes: ['patrocinador', 'super_patrocinador'],
    });

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible asignar las plataformas a este usuario ya que se encuentra bloqueado o no existe en la plataforma' });
        return;
    }

    const enlace_distribuidor = usuario.patrocinador;
    const enlace_superdistribuidor = usuario.super_patrocinador;

    // id distribuidor
    const distribuidor = await Usuarios.findOne({ 
        where: { enlace_afiliado: enlace_distribuidor },
        attributes: ['id_usuario'],
    });
    const idDistribuidor = distribuidor.id_usuario;

    // id superdistribuidor
    const superdistribuidor = await Usuarios.findOne({ 
        where: { enlace_afiliado: enlace_superdistribuidor },
        attributes: ['id_usuario'],
    });
    const idSuperdistribuidor = superdistribuidor.id_usuario;

    // recorrer array con asignaciones
    for(var i = 0; i < objetoAsignaciones.length; i++) {
        const idPlataforma = objetoAsignaciones[i][0].id;
        const valorPlataforma = objetoAsignaciones[i][0].valor;
        
        if(valorPlataforma !== '') {
            const asignacion = await Asignaciones.findOne({ 
                where: { 
                    [Op.and]: [{ usuarioIdUsuario: id_usuario }, { plataformaIdPlataforma: idPlataforma }],  
                }
            });
            
            if(asignacion !== null) {

                asignacion.valor = valorPlataforma;
                await asignacion.save();

            } else {

                await Asignaciones.create({
                    id_asignacion: uuid_v4(),
                    valor: valorPlataforma,
                    id_distribuidor: idDistribuidor,
                    id_superdistribuidor: idSuperdistribuidor,
                    usuarioIdUsuario: id_usuario,
                    plataformaIdPlataforma: idPlataforma
                });
            }

        }

    }

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Las plataformas se asignaron con éxito al usuario.' });
    return;

}

exports.tablaAsignarPlataformas = async (req, res) => {

    const id_usuario = req.body.id.trim();

    const asignaciones = await Asignaciones.findAll({
        where: { 
            [Op.and]: [{ usuarioIdUsuario: id_usuario }],
        }
    });

    res.json(asignaciones);
    return;

}


// ============================================================================
//                      Superdistribuidores controller
// ============================================================================


// Admin Usuarios
exports.adminUsuariosSuperdistribuidor = async (req, res) => {
    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});
    const usuarios = await Usuarios.findAll({
        where: { 
            [Op.and]: [{ super_patrocinador: req.user.enlace_afiliado }, {perfil: {[Op.ne]: 'superdistribuidor'}}],
        }
    });
    const distribuidores = await Usuarios.findAll();
    const plataformas = await Plataformas.findAll({
        where: { estado: 1 }
    });

    res.render('dashboard/adminUsuariosSuperdistribuidor', {
        nombrePagina : 'Administrador Usuarios',
        titulo: 'Administrador Usuarios',
        breadcrumb: 'Administrador Usuarios',
        classActive: req.path.split('/')[2],
        usuario,
        usuarios,
        plataformas,
        distribuidores
    })
}

// Cargar saldo
exports.cargarSaldo = async (req, res) => {
    const idUsuario = req.body.id;
    const valorCargar = req.body.valor;
    const usuario = await Usuarios.findOne({ where: { id_usuario: idUsuario }});

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible cargar saldo a este usuario.' });
        return;
    }

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: usuario.super_patrocinador }});

    await Cargas.create({
        idCarga: uuid_v4(),
        idSuperdistribuidor: superdistribuidor.id_usuario,
        valor: valorCargar,
        accionCarga: 'carga',
        tipoCarga: 'carga directa',
        saldoAnterior: usuario.saldo,
        saldoNuevo: Number(usuario.saldo) + Number(valorCargar),
        usuarioIdUsuario: idUsuario
    });

    usuario.saldo = Number(usuario.saldo) + Number(valorCargar);
    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'El saldo fue cargado con éxito.' });
    return;

}

// Restar Saldo
exports.restarSaldo = async (req, res) => {

    const idUsuario = req.body.id;
    const valorCargar = req.body.valor;
    const usuario = await Usuarios.findOne({ where: { id_usuario: idUsuario }});

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible restar saldo a este usuario.' });
        return;
    }

    if(usuario.saldo < valorCargar) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible restar saldo a este usuario, debido a que el saldo que desea restar es mayor al saldo actual del usuario. El saldo actual del usuario es '+usuario.saldo });
        return;
    }

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: usuario.super_patrocinador }});

    await Cargas.create({
        idCarga: uuid_v4(),
        idSuperdistribuidor: superdistribuidor.id_usuario,
        valor: valorCargar,
        accionCarga: 'restar',
        tipoCarga: 'carga directa',
        saldoAnterior: usuario.saldo,
        saldoNuevo: Number(usuario.saldo) - Number(valorCargar),
        usuarioIdUsuario: idUsuario
    });

    usuario.saldo = Number(usuario.saldo) - Number(valorCargar);
    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'El saldo fue restado con éxito.' });
    return;

}


// ============================================================================
//                      Usuarios controller
// ============================================================================

exports.usuarios =  async ( req, res) => {
    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});
    const usuarios = await Usuarios.findAll({
        where: { 
            [Op.and]: [{ patrocinador: req.user.enlace_afiliado }],
        }
    });

    const distribuidores = await Usuarios.findAll();
    const plataformas = await Plataformas.findAll({
        where: { estado: 1 }
    });

    res.render('dashboard/usuarios', {
        nombrePagina : 'Administrador Usuarios',
        titulo: 'Administrador Usuarios',
        breadcrumb: 'Administrador Usuarios',
        classActive: req.path.split('/')[2],
        usuario,
        usuarios,
        plataformas,
        distribuidores
    })
}

// Cargar saldo
exports.cargarSaldoUsuario = async (req, res) => {
    const idUsuario = req.body.id;
    const valorCargar = req.body.valor;
    const usuario = await Usuarios.findOne({ where: { id_usuario: idUsuario }});
    const distribuidor = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario }});

    const saldoDistribuidor = distribuidor.saldo;

    if(saldoDistribuidor < valorCargar) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible cargar saldo a este usuario, debido a que tu saldo es inferior al saldo que deseas cargar' });
        return;
    }

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible cargar saldo a este usuario.' });
        return;
    }

    usuario.saldo = Number(usuario.saldo) + Number(valorCargar);
    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'El saldo fue cargado con éxito.' });
    return;

}

// Restar Saldo
exports.restarSaldoUsuario = async (req, res) => {

    const idUsuario = req.body.id;
    const valorCargar = req.body.valor;
    const usuario = await Usuarios.findOne({ where: { id_usuario: idUsuario }});

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible restar saldo a este usuario.' });
        return;
    }

    if(usuario.saldo < valorCargar) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible restar saldo a este usuario, debido a que el saldo que desea restar es mayor al saldo actual del usuario. El saldo actual del usuario es '+usuario.saldo });
        return;
    }

    usuario.saldo = Number(usuario.saldo) - Number(valorCargar);
    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'El saldo fue restado con éxito.' });
    return;

}

// Asignar plataformas
exports.asignarPlataformaUsuario = async (req, res) => {

    const id_usuario = req.body.id.trim();
    const objetoAsignaciones = req.body.asignaciones;

    if(objetoAsignaciones === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible asignar las plataformas, debe ingresar algún valor en las casillas.' });
        return;
    }

    // datos del usuario a asignar
    const usuario = await Usuarios.findOne({ 
        where: { 
            [Op.and]: [{ id_usuario: id_usuario }, { bloqueo: 0 }], 
        },
        attributes: ['patrocinador', 'super_patrocinador'],
    });

    if(!usuario) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible asignar las plataformas a este usuario ya que se encuentra bloqueado o no existe en la plataforma' });
        return;
    }

    const enlace_distribuidor = usuario.patrocinador;
    const enlace_superdistribuidor = usuario.super_patrocinador;

    // id distribuidor
    const distribuidor = await Usuarios.findOne({ 
        where: { enlace_afiliado: enlace_distribuidor },
        attributes: ['id_usuario'],
    });
    const idDistribuidor = distribuidor.id_usuario;

    // id superdistribuidor
    const superdistribuidor = await Usuarios.findOne({ 
        where: { enlace_afiliado: enlace_superdistribuidor },
        attributes: ['id_usuario'],
    });
    const idSuperdistribuidor = superdistribuidor.id_usuario;

    // recorrer array con asignaciones
    for(var i = 0; i < objetoAsignaciones.length; i++) {
        const idPlataforma = objetoAsignaciones[i][0].id;
        const valorPlataforma = objetoAsignaciones[i][0].valor;
        const asignacionDistribuidor = await Asignaciones.findOne({ 
            where: { 
                [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }, { plataformaIdPlataforma: idPlataforma }],  
            },
            attributes: ['valor'],
        });
        
        if(Number(asignacionDistribuidor.valor) >= Number(valorPlataforma)) {
            res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible asignar el valor a esta plataforma ya es que menor o igual a su valor asignado.' });
            console.log(asignacionDistribuidor.valor);
            return;
        }

        if(valorPlataforma !== '') {
            const asignacion = await Asignaciones.findOne({ 
                where: { 
                    [Op.and]: [{ usuarioIdUsuario: id_usuario }, { plataformaIdPlataforma: idPlataforma }],  
                }
            });
            
            if(asignacion !== null) {

                asignacion.valor = valorPlataforma;
                await asignacion.save();

            } else {

                await Asignaciones.create({
                    id_asignacion: uuid_v4(),
                    valor: valorPlataforma,
                    id_distribuidor: idDistribuidor,
                    id_superdistribuidor: idSuperdistribuidor,
                    usuarioIdUsuario: id_usuario,
                    plataformaIdPlataforma: idPlataforma
                });
            }

        }

    }

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Las plataformas se asignaron con éxito al usuario.' });
    return;

}