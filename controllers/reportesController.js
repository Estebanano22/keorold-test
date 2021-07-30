const Usuarios = require('../models/UsuariosModelo');
const Plataformas = require('../models/plataformasModelo');
const Cargas = require('../models/cargasModelo');
const Asignaciones = require('../models/asignacionesModelo');
const Ganancias = require('../models/gananciasModelo');
const Consignaciones = require('../models/consignacionesModelo');
const { Op } = require("sequelize");
const {body, validationResult} = require('express-validator');
const multer = require('multer');
const shortid = require('shortid');
const { v4: uuid_v4 } = require('uuid');
const fs = require('fs');
const xlsx = require('node-xlsx');
const path = require('path');
const dotenv = require('dotenv');
const Excel = require('Excel4node');

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

exports.reporteConsignaciones = async (req, res) => {

    const consignaciones = await Consignaciones.findAll({
        where: {
            [Op.and]: [{idSuperdistribuidor: req.user.id_usuario}]
        },
        include: [
            {model: Usuarios, foreignKey: 'usuarioIdUsuario'}
        ],
        order: [['fecha', 'DESC']]
    });

    // Create a new instance of a Workbook class
    const workbook = new Excel.Workbook();
    // Add Worksheets to the workbook
    const worksheet = workbook.addWorksheet('Reporte Consignaciones Superdistribuidor');
    // Create a reusable style
    const style1 = workbook.createStyle({
        font: {
            color: '#6259ca',
            bold: true,
            size: 12
        },
        fill: {
            type: 'pattern',
            patternType: 'solid',
            fgColor: 'eaedf7', 
        },
        border: {
            left: {
                style: 'thin',
                color: 'black',
            },
            right: {
                style: 'thin',
                color: 'black',
            },
            top: {
                style: 'thin',
                color: 'black',
            },
            bottom: {
                style: 'thin',
                color: 'black',
            },
            outline: false,
        },
    });

    const style2 = workbook.createStyle({
        font: {
            color: '#000000',
            size: 12
        },
        border: {
            left: {
                style: 'thin',
                color: 'black',
            },
            right: {
                style: 'thin',
                color: 'black',
            },
            top: {
                style: 'thin',
                color: 'black',
            },
            bottom: {
                style: 'thin',
                color: 'black',
            },
            outline: false,
        },
    });

    const style3 = workbook.createStyle({
        font: {
          color: '#000000',
          size: 12
        },
        numberFormat: '$#,##0.00; ($#,##0.00); -',
        border: {
            left: {
                style: 'thin',
                color: 'black',
            },
            right: {
                style: 'thin',
                color: 'black',
            },
            top: {
                style: 'thin',
                color: 'black',
            },
            bottom: {
                style: 'thin',
                color: 'black',
            },
            outline: false,
        },
    });

    const style4 = workbook.createStyle({
        font: {
            color: '#ffffff',
            bold: true,
            size: 12
        },
        fill: {
            type: 'pattern',
            patternType: 'solid',
            fgColor: '6259ca', 
        },
        alignment: {
            wrapText: true,
            horizontal: 'center',
        },
        border: {
            left: {
                style: 'thin',
                color: 'black',
            },
            right: {
                style: 'thin',
                color: 'black',
            },
            top: {
                style: 'thin',
                color: 'black',
            },
            bottom: {
                style: 'thin',
                color: 'black',
            },
            outline: false,
        },
    });

    const style5 = workbook.createStyle({
        font: {
            color: '#000000',
            size: 12
        },
        border: {
            left: {
                style: 'thin',
                color: 'black',
            },
            right: {
                style: 'thin',
                color: 'black',
            },
            top: {
                style: 'thin',
                color: 'black',
            },
            bottom: {
                style: 'thin',
                color: 'black',
            },
            outline: false,
        },
        numberFormat: 'm/d/yy hh:mm:ss'
    });

    worksheet.column(1).setWidth(45);
    worksheet.column(2).setWidth(20);
    worksheet.column(3).setWidth(20);
    worksheet.column(4).setWidth(25);
    worksheet.column(5).setWidth(20);
    worksheet.column(6).setWidth(50);
    worksheet.column(7).setWidth(20);
    worksheet.column(8).setWidth(20);

    worksheet.cell(1, 1, 1, 8, true).string('Reporte Consignaciones Superdistribuidor - Fullentretenimiento').style(style4);

    worksheet.cell(2, 1).string('Id consignación').style(style1);
    worksheet.cell(2, 2).string('Usuario cargado').style(style1);
    worksheet.cell(2, 3).string('Valor consignado').style(style1);
    worksheet.cell(2, 4).string('Banco (Tipo consignación)').style(style1);
    worksheet.cell(2, 5).string('No. Referencia').style(style1);
    worksheet.cell(2, 6).string('Observaciones').style(style1);
    worksheet.cell(2, 7).string('Estado').style(style1);
    worksheet.cell(2, 8).string('Fecha de consignación').style(style1);

    for (let i = 0; i < consignaciones.length; i += 1) {
    
        if(consignaciones[i].estado === 1) {
            var estados = 'Aprobada';
        } else if(consignaciones[i].estado === 2) {
            var estados = 'Rechazada';
        } else {
            var estados = 'Sin procesar';
        }

        if(consignaciones[i].observaciones !== null) {
            var observaciones = consignaciones[i].observaciones;
        } else {
            var observaciones = '-';
        }

        worksheet.cell(i + 3, 1).string(consignaciones[i].idConsignacion).style(style2);
        worksheet.cell(i + 3, 2).string(consignaciones[i].usuario.nombre).style(style2);
        worksheet.cell(i + 3, 3).number(Number(consignaciones[i].valor)).style(style3);
        worksheet.cell(i + 3, 4).string(consignaciones[i].tipoConsignacion).style(style2);
        worksheet.cell(i + 3, 5).string(consignaciones[i].referencia).style(style2);
        worksheet.cell(i + 3, 6).string(observaciones).style(style2);
        worksheet.cell(i + 3, 7).string(estados).style(style2);
        worksheet.cell(i + 3, 8).date(consignaciones[i].fecha).style(style5);
    }

    const idTemporal = shortid.generate();
    const nameTemp = `/uploads/temp/${idTemporal}.xlsx`;
    const url = `${__dirname}/../public/uploads/temp/${idTemporal}.xlsx`;
        workbook.write(url);
    // workbook.write(url, function(err, stats) {
    //     if (err) {
    //       console.log('Error: '+err);
    //     } else {
    //       console.log('Status: '+stats);
    //     }
    // });

    res.json({resp: 'success', url: nameTemp});
    return;

}

exports.reporteConsignacionesStep = async (req, res) => {

    fs.unlink(__dirname+req.body.data, () => {
        console.log('Archivo Excel removido');
    })

}