const mongoose = require('mongoose');

const Usuario = mongoose.model('Usuario', {
    nombre: String,
    email: { type: String, unique: true },
    password: String,
    rol: { type: String, enum: ['paciente', 'medico'] },
    especialidad: { type: String, required: function() { return this.rol === 'medico' } }
});

module.exports = Usuario; 