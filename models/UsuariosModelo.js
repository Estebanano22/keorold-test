const Sequelize = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcrypt-nodejs');

const Usuarios = db.define('usuarios', {
    id_usuario: {
        type: Sequelize.INTEGER(11),
        primaryKey: true,
        autoIncrement: true
    },
    perfil: {
        type: Sequelize.STRING(20),
        defaultValue : null
    },
    pais: {
        type: Sequelize.STRING(20),
        defaultValue : null
    },
    nombre: {
        type: Sequelize.STRING(80),
        defaultValue : null,
        validate: {
            notEmpty: {
                msg: 'El nombre no puede ser vacio'
            }
        }
    },
    saldo: {
        type: Sequelize.DECIMAL(20, 2),
        defaultValue : 0.00
    },
    email: {
        type: Sequelize.STRING(100),
        defaultValue : null,
        unique: {
            args: true,
            msg: 'El email ya está en uso'
        },
        validate: {
            isEmail: { msg: 'Por favor ingrese un correo valido' }
        }
    },
    password: {
        type: Sequelize.STRING(70),
        defaultValue : null,
        validate: {
            notEmpty: {
                msg: 'El password no puede ser vacio'
            }
        }
    },
    suscripcion: {
        type: Sequelize.INTEGER(1),
        defaultValue : 1
    },
    bloqueo: {
        type: Sequelize.INTEGER(1),
        defaultValue : 0
    },
    desactivar: {
        type: Sequelize.INTEGER(1),
        defaultValue : 0
    },
    verificacion: {
        type: Sequelize.INTEGER(1),
        defaultValue : 0
    },
    foto: {
        type: Sequelize.STRING(250),
        defaultValue : null
    },
    enlace_afiliado: {
        type: Sequelize.STRING(100),
        defaultValue : null,
        unique: {
            args: true,
            msg: 'El enlace de afiliado ya existe en el sistema'
        }
    },
    patrocinador: {
        type: Sequelize.STRING(100),
        defaultValue : null
    },
    super_patrocinador: {
        type: Sequelize.STRING(100),
        defaultValue : null
    },
    facebook: {
        type: Sequelize.STRING(100),
        defaultValue : null
    },
    instagram: {
        type: Sequelize.STRING(100),
        defaultValue : null
    },
    telefono_movil: {
        type: Sequelize.STRING(20),
        defaultValue : null
    },
    direccion: {
        type: Sequelize.STRING(70),
        defaultValue : null
    },
    fecha: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    observaciones: {
        type: Sequelize.STRING(100),
        defaultValue : null
    },
    pdf_consignaciones: {
        type: Sequelize.STRING(250),
        defaultValue : null
    },
    qr_consignaciones: {
        type: Sequelize.STRING(250),
        defaultValue : null
    },
    ip: {
        type: Sequelize.STRING(16),
        defaultValue : null
    },

},{ 
    // tableName: 'usuarios',
    hooks: {
        beforeCreate(usuario) {
            usuario.password = bcrypt.hashSync(usuario.password,
                bcrypt.genSaltSync(10), null);
        }
    }
});

// Metodo para comparar los passwords
Usuarios.prototype.validarPassword = function(password) {
    return bcrypt.compareSync(password, this.password)
}

module.exports = Usuarios;