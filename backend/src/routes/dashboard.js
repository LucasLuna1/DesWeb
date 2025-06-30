const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middlewares/auth');
const Usuario = require('../models/Usuario');
const Cita = require('../models/Cita'); 

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.session.userId);

        // Verifica si el usuario es un médico
        if (usuario.rol === 'medico') {
            const citas = await Cita.find({ medico: usuario._id }).populate('paciente');
            res.render('dashboard-medico', { usuario, citas });
        } else {
            const citas = await Cita.find({ paciente: usuario._id }).populate('medico');
            const medicos = await Usuario.find({ rol: 'medico' });
            res.render('dashboard-paciente', { usuario, citas, medicos });
        }
    } catch (error) {
        res.status(500).render('error', { error: 'Error al cargar el dashboard' });
    }
});

// Crea una nueva cita (paciente elige médico, fecha y hora)
router.post('/citas', isAuthenticated, async (req, res) => {
    try {
        const { medicoId, fecha, hora } = req.body;

        // Crea la cita
        const cita = new Cita({
            paciente: req.session.userId,
            medico: medicoId,
            fecha,
            hora,
            estado: 'pendiente'
        });

        // Guarda la cita
        await cita.save();
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).render('error', { error: 'Error al crear la cita' });
    }
});

// Aceptar/Rechazar/etc de un medico
router.post('/citas/:id/estado', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        await Cita.findByIdAndUpdate(id, { estado });
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).render('error', { error: 'Error al actualizar la cita' });
    }
});

module.exports = router;
