const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

router.get('/registro', (req, res) => {
    res.render('registro');
});

router.post('/registro', async (req, res) => {
    try {
        const { nombre, email, password, rol, especialidad } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const usuario = new Usuario({
            nombre,
            email,
            password: hashedPassword,
            rol,
            especialidad: rol === 'medico' ? especialidad : undefined
        });
        
        await usuario.save();
        res.redirect('/login');
    } catch (error) {
        res.status(500).render('error', { error: 'Error en el registro' });
    }
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const usuario = await Usuario.findOne({ email });
        
        // Valida usuario
        if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
            return res.status(401).render('login', { error: 'Credenciales inválidas' });
        }

        // Guarda los datos del usuario en la sesión
        req.session.userId = usuario._id;
        req.session.rol = usuario.rol;
        res.redirect('/dashboard');
    } catch (error) {
        res.status(500).render('error', { error: 'Error en el login' });
    }
});

router.get('/logout', (req, res) => {
    // Elimina datos de su sesion 
    req.session.destroy(); 
    res.redirect('/');
});

module.exports = router;
