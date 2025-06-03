const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Register user
router.post('/register', [
  // Validación
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role').isIn(['patient', 'doctor']).withMessage('Rol inválido'),
  // Validaciones específicas para doctores
  body('specialty').if(body('role').equals('doctor')).notEmpty().withMessage('La especialidad es requerida para doctores'),
  body('licenseNumber').if(body('role').equals('doctor')).notEmpty().withMessage('El número de licencia es requerido para doctores')
], async (req, res) => {
  try {
    // Validar inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, specialty, licenseNumber } = req.body;

    // Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Si es doctor, verificar si la licencia ya está registrada
    if (role === 'doctor') {
      const existingDoctor = await Doctor.findOne({ license: licenseNumber });
      if (existingDoctor) {
        return res.status(400).json({ message: 'El número de licencia ya está registrado' });
      }
    }

    // Crear nuevo usuario
    user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    // Si es doctor, crear entrada en la colección de doctores
    if (role === 'doctor') {
      const doctor = new Doctor({
        user: user._id,
        speciality: specialty,
        license: licenseNumber,
        consultationFee: 0, // Valor por defecto
        schedule: [
          // Horario por defecto, Lunes a Viernes de 9 a 17
          {
            day: 'Monday',
            startTime: '09:00',
            endTime: '17:00'
          },
          {
            day: 'Tuesday',
            startTime: '09:00',
            endTime: '17:00'
          },
          {
            day: 'Wednesday',
            startTime: '09:00',
            endTime: '17:00'
          },
          {
            day: 'Thursday',
            startTime: '09:00',
            endTime: '17:00'
          },
          {
            day: 'Friday',
            startTime: '09:00',
            endTime: '17:00'
          }
        ]
      });

      await doctor.save();
    }

    // Crear token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Enviar respuesta
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Si es doctor, obtener información adicional
    let additionalInfo = {};
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: user._id }).select('-reviews');
      if (doctor) {
        additionalInfo = {
          specialty: doctor.speciality,
          license: doctor.license,
          consultationFee: doctor.consultationFee,
          schedule: doctor.schedule
        };
      }
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...additionalInfo
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si es doctor, incluir información adicional
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: user._id }).select('-reviews').lean();
      if (doctor) {
        user.doctorInfo = doctor;
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error in get me:', error);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 