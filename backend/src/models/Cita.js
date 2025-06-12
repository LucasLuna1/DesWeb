const mongoose = require('mongoose');

const Cita = mongoose.model('Cita', {
    paciente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    medico: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    fecha: Date,
    hora: String,
    estado: { type: String, enum: ['pendiente', 'confirmada', 'cancelada'] }
});

module.exports = Cita; 