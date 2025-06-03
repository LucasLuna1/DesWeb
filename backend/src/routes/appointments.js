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
    const user = await User.findById(req.user.userId).lean();
    
    let appointments;
    if (user.role === 'doctor') {
      appointments = await Appointment.find({ doctor: req.user.userId })
        .populate('patient', 'name email')
        .populate('doctor', 'name email specialization')
        .sort({ date: 1, time: 1 })
        .lean();
    } else {
      appointments = await Appointment.find({ patient: req.user.userId })
        .populate('doctor', 'name email specialization')
        .populate('patient', 'name email')
        .sort({ date: 1, time: 1 })
        .lean();
    }
    
    res.json(appointments);
  } catch (error) {
    console.error('Error getting appointments:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/available-slots', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
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
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Book a new appointment
router.post('/',
  [
    auth,
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
    body('type').isIn(['first-visit', 'follow-up', 'consultation', 'emergency']).withMessage('Valid appointment type is required'),
    body('symptoms').notEmpty().withMessage('Symptoms are required'),
    body('fee').isNumeric().withMessage('Valid fee is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, date, time, type, symptoms, fee } = req.body;

      // Check if doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(400).json({ message: 'Invalid doctor' });
      }

      // Check if time slot is available
      const isAvailable = await Appointment.isTimeSlotAvailable(doctorId, new Date(date), time);
      if (!isAvailable) {
        return res.status(400).json({ message: 'Time slot is not available' });
      }

      // Create appointment
      const appointment = new Appointment({
        patient: req.user.userId,
        doctor: doctorId,
        date: new Date(date),
        time,
        type,
        symptoms,
        fee,
        status: 'pending'
      });

      await appointment.save();

      // Populate the response
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctor', 'name email specialization')
        .populate('patient', 'name email')
        .lean();

      res.status(201).json(populatedAppointment);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update appointment status
router.patch('/:id/status',
  [
    auth,
    body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get appointment and check authorization
      const appointment = await Appointment.findById(req.params.id)
        .populate('doctor', 'name email specialization')
        .populate('patient', 'name email');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check authorization (only doctor or patient can update)
      const isDoctor = appointment.doctor._id.toString() === req.user.userId.toString();
      const isPatient = appointment.patient._id.toString() === req.user.userId.toString();
      
      if (!isDoctor && !isPatient) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Update status
      appointment.status = req.body.status;
      await appointment.save();

      res.json(appointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ 
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router; 