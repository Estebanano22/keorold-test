const Usuarios = require('../models/UsuariosModelo');
const Consignaciones = require('../models/consignacionesModelo');
const Medios = require('../models/mediosModelo');
const Cargas = require('../models/cargasModelo');
const { Op } = require("sequelize");
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');
const { s3, bucket } = require('../config/awsS3');
const multerS3 = require('multer-s3');
const axios = require('axios');

exports.reportarConsignacion = async (req, res) => {

    const consignaciones = await Consignaciones.findAll({
        where: {
            [Op.and]: [{ usuarioIdUsuario: req.user.id_usuario }]
        },
        order: [['fecha', 'DESC']]
    });

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador } });

    const medios = await Medios.findAll({
        where: {
            [Op.and]: [{ idSuperdistribuidor: superdistribuidor.id_usuario }, { estado: 1 }]
        }
    });

    const usuario = await Usuarios.findOne({ where: { id_usuario: req.user.id_usuario } });

    res.render('dashboard/reportarConsignacion', {
        nombrePagina: 'Reportar consignaciones',
        titulo: 'Reportar consignaciones',
        breadcrumb: 'Reportar consignaciones',
        classActive: req.path.split('/')[2],
        usuario,
        consignaciones,
        medios
    })

}

exports.verifyTransaction = async (req, res) =>{
    const paramRef  = req.query.ref_payco;
    console.log(paramRef)
    let reqRaw;
    try{
        reqRaw = await axios.get('https://secure.epayco.co/validation/v1/reference/'+paramRef);
    }catch(e){
        console.log(e);
        return res.redirect('/dashboard/inicio');
    }
    
    if(!reqRaw){
        return res.redirect('/dashboard/inicio');
    }

    if(!reqRaw.data){
        return res.redirect('/dashboard/inicio');
    }

    let status;
    let reqRef;
    try {
        reqRef = reqRaw.data;
        status = reqRef.data.x_cod_transaction_state;
    } catch (error) {
        return res.redirect('/dashboard/inicio');
    }

    console.log(reqRef)

    if(reqRef.status === false){
        return res.redirect('/dashboard/inicio');
    }

    const consignacion = await Consignaciones.findOne({
        where: {
            referencia: reqRef.data.x_id_factura
        }
    });

    if(!consignacion){
        return res.redirect('/dashboard/inicio');
    }

    console.log(consignacion);

    let estadoTransaccion;
    switch (status) {
        case 1:
            estadoTransaccion = 1
            break;
        case 2:
            estadoTransaccion = 2
            break;
    
        default:
            estadoTransaccion = 0
            break;
    }

    if(estadoTransaccion === 1){
        const idUser = reqRef.data.x_extra1;
        if(idUser.length > 0 && consignacion.estado === 0){
            console.log("idUser: " + idUser);

            const userToAsignSaldo = await Usuarios.findOne({where: {id_usuario: idUser}});
            const saldoAnterior = userToAsignSaldo.saldo;
            
            console.log(Number(saldoAnterior));
            
            let saldoNuevoNeto;
            
            if(Number(reqRef.data.x_amount) > 29.99999){
                saldoNuevoNeto = Number(reqRef.data.x_amount);
            }else{
                saldoNuevoNeto = Number(reqRef.data.x_amount) - 0.50;
            }
            
            console.log('Saldo a recargar: ' + saldoNuevoNeto);
            const newSaldo = Number(saldoAnterior) + Number(saldoNuevoNeto); 
            
            userToAsignSaldo.saldo = newSaldo;
            
            console.log('Nuevo saldo al usuario: ' + userToAsignSaldo.saldo);
            userToAsignSaldo.save()
        }
    }

    consignacion.estado = estadoTransaccion;
    consignacion.save();
    // if(consignacion.estado === 1){
    //     return res.redirect('/cerrar-sesion');
    // }else{
    //     return res.redirect('/dashboard/reportarConsignacion');
    // }
    return res.redirect('/dashboard/reportarConsignacion');
}

exports.updateEpaycoTransaction = async (req, res) => {
    const refEpayco = req.body.ref_epayco;
    await axios({
        url: 'https://apify.epayco.co/login/mail',
        headers: {
            public_key: '7683004bce02a70bdfb7a8cc777c556c'
        },
        auth: {
            username: 'aclogistica01@gmail.com',
            password: 'Danna963+'
        },
        method: 'POST'
    }).then( async(rest)=>{
        if(rest.data.token){
            await axios({
                method: 'GET',
                url: 'https://apify.epayco.co/transaction/detail',
                headers: { 
                    Authorization: `Bearer ${rest.data.token}`
                },
                data: {
                    filter:{
                        referencePayco: refEpayco
                    }
                }
            }).then(async (rest2) => {
                console.log(rest2.data);
                if(rest2.data.data.status === 'Rechazada'){
                    const transaction = await Consignaciones.findOne({ where: {extra_ref1: refEpayco}})
                
                    transaction.estado = 2;
                    transaction.save();
                
                    return res.json({ titulo: '¡Lo Sentimos!', resp: 'warning', descripcion: 'La transacción fue rechazada.' });
                
                }else if(rest2.data.data.status === 'Aceptada') {
                    
                    const transaction = await Consignaciones.findOne({ where: {extra_ref1: refEpayco}})  
                    const userToAsignSaldo = await Usuarios.findOne({where: {id_usuario: req.user.id_usuario}});
                    const saldoAnterior = userToAsignSaldo.saldo;
                    
                    let saldoNuevoNeto;
                    
                    if(Number(reqRef.data.x_amount) > 29.99999){
                        saldoNuevoNeto = Number(reqRef.data.x_amount);
                    }else{
                        saldoNuevoNeto = Number(reqRef.data.x_amount) - 0.50;
                    }
                    
                    const newSaldo = Number(saldoAnterior) + Number(saldoNuevoNeto); 
                    
                    userToAsignSaldo.saldo = newSaldo;
                    transaction.estado = 1;
                    
                    await transaction.save();
                    await userToAsignSaldo.save();
                    
                    return res.json({ titulo: '¡Listo!', resp: 'success', descripcion: 'La transacción fue Aceptada correctamente.' });
                } else {
                    return res.json({ titulo: '¡Lo Sentimos!', resp: 'warning', descripcion: 'La transacción no fue finalizada.' });
                }
            }).catch(err2 => {
                console.log('Error en catch');
                return res.json({ titulo: '¡Lo Sentimos!', resp: 'warning', descripcion: 'No se pudo actualizar el estado de la transacción.' });
            })
        }else{
            console.log('Error de data');
            return res.json({ titulo: '¡Lo Sentimos!', resp: 'warning', descripcion: 'No se pudo actualizar el estado de la transacción.' });
        }
    }).catch(err => {
        console.log('Error en catch');
        return res.json({ titulo: '¡Lo Sentimos!', resp: 'warning', descripcion: 'No se pudo actualizar el estado de la transacción.' });
    })
}

exports.newFetchUpdateTransaction = async (req, res) => {
    const estado = req.body.estado;
    const referencia = req.body.referencia_factura;
    const recibo = req.body.recibo;
    const valorConsignado = req.body.valor_consignado;
    const tipoConsignacion = 'EPAYCO';
    const telefonoCuenta = req.user.telefono_movil;
    const fechaHoraConsignacion = new Date();

    const existReference = await Consignaciones.findOne({ where : {referencia: referencia} });

    if(!existReference){
        const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador } });
        const userToAsignSaldo = await Usuarios.findOne({where: {id_usuario: req.user.id_usuario}});
        const saldoAnterior = userToAsignSaldo.saldo;       
        
        let saldoNuevoNeto;
        if(Number(valorConsignado) > 29.99999){
            saldoNuevoNeto = Number(valorConsignado);
        }else{
            saldoNuevoNeto = Number(valorConsignado) - 0.50;
        }
        console.log('estado: ' + estado);
        if(estado === 1 || estado === '1'){
            const newSaldo = Number(saldoAnterior) + Number(saldoNuevoNeto); 
            userToAsignSaldo.saldo = newSaldo;
            await userToAsignSaldo.save();
        }

        const newConsignacion = await Consignaciones.create({
            idConsignacion: uuid_v4(),
            idSuperdistribuidor: superdistribuidor.id_usuario,
            valor: saldoNuevoNeto,
            estado: estado,
            tipoConsignacion: tipoConsignacion,
            referencia: referencia,
            comprobante: 'No aplica',
            extra_ref1: recibo,
            usuarioIdUsuario: req.user.id_usuario,
            celularConsignacion: telefonoCuenta,
            fechaHoraConsignacion: fechaHoraConsignacion
        });

        return res.json({ titulo: 'Listo', resp: 'info', descripcion: 'La transacción creada y asignada al usuario.' });
    }
}

exports.createEpayco = async (req, res) => {
    const usuario = await Usuarios.findOne({ where: { email: req.user.email }});
    const refNew = uuid_v4();
    const amountReq = req.body.valor;
    
    var data = {
        name: usuario.nombre,
        description: 'Recargar saldo',
        invoice: refNew,
        currency: 'usd',
        amount: '' + amountReq + '',
        tax_base: '0',
        tax: '0',
        country: 'ec',
        lang: 'es',
        external: 'false',
        test: 'false',
        publicKey: '7683004bce02a70bdfb7a8cc777c556c',
        extra1: '' + req.user.id_usuario + ''
    };
    res.json(data);
}

const configuracionMulter = ({
    storage: multerS3({
        s3,
        bucket,
        acl: 'public-read',
        metadata: (req, file, next) => {
            next(null, {
                filename: file.fieldname
            });
        },
        key: (req, file, next) => {
            next(null, `vouchers/${file.originalname}`);
        }
    })
});

const upload = multer(configuracionMulter).single('comprobante');

exports.uploadComprobante = async (req, res, next) => {

    upload(req, res, function (error) {
        if (error) {
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
    const referencia = req.body.referencia.toLowerCase();
    const telefonoCuenta = req.body.telefonoCuenta;
    const fechaHoraConsignacion = req.body.fechaHoraConsignacion;

    const consignaciones = await Consignaciones.findOne({
        where: {
            [Op.and]: [{ referencia: referencia }, { estado: 1 }]
        }
    });

    if (consignaciones) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'El numero de referencia ingresado ya se encuentra en nuestro sistema, por favor verifique e intente nuevamente.' });
        return;
    }

    const consignacionesEnProceso = await Consignaciones.findOne({
        where: {
            [Op.and]: [{ referencia: referencia }, { estado: 0 }]
        }
    });

    if (consignacionesEnProceso) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Ya existe una consignación en proceso de revisión con este nuemero de referencia, por favor vuelva a intentarlo más tarde.' });
        return;
    }

    if (fechaHoraConsignacion === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Por favor ingrese la fecha y hora en la que realizo la consignación ó transferencia.' });
        return;
    }

    if (!req.file) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debe subir el pantallazo o foto legible del comprobante de consignación ó transferencia.' });
        return;
    }

    if (req.file.location === 'undefined' || req.file.location === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Debe subir el pantallazo o foto legible del comprobante de consignación ó transferencia.' });
        return;
    }

    if (telefonoCuenta === '') {
        var telefono = 'no aplica';
    } else {
        var telefono = telefonoCuenta;
    }

    const superdistribuidor = await Usuarios.findOne({ where: { enlace_afiliado: req.user.super_patrocinador } });

    if (valorConsignado === '' || tipoConsignacion === '' || referencia === '') {
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
        comprobante: req.file.location,
        usuarioIdUsuario: req.user.id_usuario,
        celularConsignacion: telefono,
        fechaHoraConsignacion: fechaHoraConsignacion
    });

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Consignación reportada con éxito.' });
    return;

}

exports.adminConsignaciones = async (req, res) => {

    const consignaciones = await Consignaciones.findAll({
        where: {
            [Op.and]: [{ idSuperdistribuidor: req.user.id_usuario }]
        },
        include: [
            { model: Usuarios, foreignKey: 'usuarioIdUsuario' }
        ],
        order: [['fecha', 'DESC']]
    });

    const countConsignaciones = await Consignaciones.count({
        where: {
            [Op.and]: [{ idSuperdistribuidor: req.user.id_usuario }, { estado: 0 }]
        }
    })

    const usuarios = await Usuarios.findAll({
        where: {
            [Op.and]: [{ super_patrocinador: req.user.enlace_afiliado }]
        }
    })

    res.render('dashboard/adminConsignaciones', {
        nombrePagina: 'Administración consignaciones',
        titulo: 'Administración consignaciones',
        breadcrumb: 'Administración consignaciones',
        classActive: req.path.split('/')[2],
        consignaciones,
        countConsignaciones,
        usuarios
    })

}

exports.aprobarConsignacion = async (req, res) => {

    const idConsignacion = req.body.id;
    const responsable = req.body.responsable.trim();

    const consignacion = await Consignaciones.findOne({
        where: {
            [Op.and]: [{ idConsignacion: idConsignacion }]
        }
    });

    if (responsable === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Lo sentimos, debe ingresar su nombre en la casilla de responable de aprobación.' });
        return;
    }

    if (!consignacion) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Lo sentimos no es posible aprobar esta consignación debido a que no existe en nuestros servidores.' });
        return;
    }

    if (consignacion.estado === 1) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible aprobar esta consignación ya que ha sido aprobada anteriormente.' });
        return;
    }

    if (consignacion.estado === 2) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible aprobar esta consignación ya que ha sido rechazada anteriormente.' });
        return;
    }

    consignacion.estado = 1;
    consignacion.responsableGestion = responsable;
    await consignacion.save();

    const usuario = await Usuarios.findOne({
        where: {
            [Op.and]: [{ id_usuario: consignacion.usuarioIdUsuario }]
        }
    });

    const saldoNuevo = Number(usuario.saldo) + Number(consignacion.valor);

    await Cargas.create({
        idCarga: uuid_v4(),
        idSuperdistribuidor: req.user.id_usuario,
        valor: consignacion.valor,
        accionCarga: 'carga',
        tipoCarga: 'consignación',
        saldoAnterior: usuario.saldo,
        saldoNuevo: saldoNuevo,
        usuarioIdUsuario: consignacion.usuarioIdUsuario,
        responsableGestion: responsable
    });

    usuario.saldo = saldoNuevo;
    await usuario.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Consignación aprobada con éxito.' });
    return;

}

exports.rechazarConsignacion = async (req, res) => {

    const idConsignacion = req.body.id;
    const motivo = req.body.motivo.trim();
    const responsable = req.body.responsable.trim();

    const consignacion = await Consignaciones.findOne({
        where: {
            [Op.and]: [{ idConsignacion: idConsignacion }]
        }
    });

    if (responsable === '') {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Lo sentimos, debe ingresar su nombre en la casilla de responable de rechazo.' });
        return;
    }

    if (!consignacion) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'Lo sentimos no es posible rechazar esta consignación debido a que no existe en nuestros servidores.' });
        return;
    }

    if (consignacion.estado === 1) {
        res.json({ titulo: '¡Lo Sentimos!', resp: 'error', descripcion: 'No es posible rechazar esta consignación ya que ha sido aprobada anteriormente.' });
        return;
    }

    consignacion.estado = 2;
    consignacion.observaciones = motivo;
    consignacion.responsableGestion = responsable;
    await consignacion.save();

    res.json({ titulo: '¡Que bien!', resp: 'success', descripcion: 'Consignación rechazada con éxito.' });
    return;

}