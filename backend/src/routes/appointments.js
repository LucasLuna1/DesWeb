const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// Get all appointments for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    let appointments;
    if (req.user.role === 'doctor') {
      // Buscar el doctor asociado al usuario
      const doctor = await Doctor.findOne({ user: req.user._id });
      if (!doctor) {
        return res.status(404).json({ message: 'Perfil de doctor no encontrado' });
      }

      appointments = await Appointment.find({ doctor: doctor._id })
        .populate({
          path: 'patient',
          select: 'name email'
        })
        .populate({
          path: 'doctor',
          select: 'speciality consultationFee',
          populate: {
            path: 'user',
            select: 'name email'
          }
        })
        .sort({ date: 1, time: 1 })
        .lean();
    } else {
      appointments = await Appointment.find({ patient: req.user._id })
        .populate({
          path: 'doctor',
          select: 'speciality consultationFee',
          populate: {
            path: 'user',
            select: 'name email'
          }
        })
        .populate({
          path: 'patient',
          select: 'name email'
        })
        .sort({ date: 1, time: 1 })
        .lean();
    }
    
    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/available-slots', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Se requiere ID del doctor y fecha' });
    }

    // Define available time slots (9 AM to 5 PM)
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
    
    // Get booked appointments for the doctor on the specified date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $ne: 'cancelled' }
    }).select('time').lean();
    
    // Filter out booked time slots
    const bookedTimes = bookedAppointments.map(apt => apt.time);
    const availableSlots = timeSlots.filter(time => !bookedTimes.includes(time));
    
    res.json(availableSlots);
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Book a new appointment
router.post('/',
  [
    auth,
    body('doctorId').notEmpty().withMessage('Se requiere ID del doctor'),
    body('date').isISO8601().withMessage('Se requiere una fecha válida'),
    body('time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Se requiere una hora válida'),
    body('type').isIn(['first-visit', 'follow-up', 'consultation', 'emergency']).withMessage('Tipo de cita no válido'),
    body('symptoms').notEmpty().withMessage('Se requieren los síntomas')
  ],
  async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, date, time, type, symptoms } = req.body;

      // Check if doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(400).json({ message: 'Doctor no válido' });
      }

      // Check if time slot is available
      const isAvailable = await Appointment.isTimeSlotAvailable(doctorId, new Date(date), time);
      if (!isAvailable) {
        return res.status(400).json({ message: 'Horario no disponible' });
      }

      // Create appointment
      const appointment = new Appointment({
        patient: req.user._id,
        doctor: doctorId,
        date: new Date(date),
        time,
        type,
        symptoms,
        status: 'pending'
      });

      await appointment.save();

      // Populate the response
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate({
          path: 'doctor',
          select: 'speciality',
          populate: {
            path: 'user',
            select: 'name email'
          }
        })
        .populate({
          path: 'patient',
          select: 'name email'
        })
        .lean();

      res.status(201).json(populatedAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ 
        message: 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update appointment status
router.patch('/:id/status',
  [
    auth,
    body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Estado no válido')
  ],
  async (req, res) => {
    try {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get appointment and check authorization
      const appointment = await Appointment.findById(req.params.id)
        .populate({
          path: 'doctor',
          select: 'speciality consultationFee',
          populate: {
            path: 'user',
            select: 'name email'
          }
        })
        .populate({
          path: 'patient',
          select: 'name email'
        });

      if (!appointment) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }

      // Check authorization (only doctor or patient can update)
      const doctor = await Doctor.findOne({ user: req.user._id });
      const isDoctor = doctor && doctor._id.toString() === appointment.doctor._id.toString();
      const isPatient = req.user._id.toString() === appointment.patient._id.toString();
      
      if (!isDoctor && !isPatient) {
        return res.status(403).json({ message: 'No autorizado' });
      }

      // Update status
      appointment.status = req.body.status;
      await appointment.save();

      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ 
        message: 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router; 