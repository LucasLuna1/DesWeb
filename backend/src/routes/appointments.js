const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const db = require('../config/db');

// Get all appointments for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.userId]);
    const user = users[0];
    
    let appointments;
    if (user.role === 'doctor') {
      [appointments] = await db.query(`
        SELECT a.*, u.name as patient_name, u.email as patient_email
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        WHERE a.doctor_id = ?
        ORDER BY a.date ASC, a.time ASC
      `, [req.user.userId]);
    } else {
      [appointments] = await db.query(`
        SELECT a.*, u.name as doctor_name, u.email as doctor_email
        FROM appointments a
        JOIN users u ON a.doctor_id = u.id
        WHERE a.patient_id = ?
        ORDER BY a.date ASC, a.time ASC
      `, [req.user.userId]);
    }
    
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/available-slots', auth, async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    // Define available time slots (9 AM to 5 PM)
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
    
    // Get booked appointments for the doctor on the specified date
    const [bookedAppointments] = await db.query(`
      SELECT time 
      FROM appointments 
      WHERE doctor_id = ? 
      AND date = ? 
      AND status != 'cancelled'
    `, [doctorId, date]);
    
    // Filter out booked time slots
    const bookedTimes = bookedAppointments.map(apt => apt.time);
    const availableSlots = timeSlots.filter(time => !bookedTimes.includes(time));
    
    res.json(availableSlots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Book a new appointment
router.post('/',
  [
    auth,
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, date, time, reason } = req.body;

      // Check if doctor exists and is actually a doctor
      const [doctors] = await db.query(
        'SELECT id FROM users WHERE id = ? AND role = "doctor"',
        [doctorId]
      );
      
      if (doctors.length === 0) {
        return res.status(400).json({ message: 'Invalid doctor' });
      }

      // Check if time slot is available
      const [existingAppointments] = await db.query(`
        SELECT id FROM appointments 
        WHERE doctor_id = ? 
        AND date = ? 
        AND time = ? 
        AND status != 'cancelled'
      `, [doctorId, date, time]);

      if (existingAppointments.length > 0) {
        return res.status(400).json({ message: 'Time slot is not available' });
      }

      // Create appointment
      const [result] = await db.query(`
        INSERT INTO appointments (patient_id, doctor_id, date, time, reason)
        VALUES (?, ?, ?, ?, ?)
      `, [req.user.userId, doctorId, date, time, reason]);

      // Get the created appointment with doctor details
      const [appointment] = await db.query(`
        SELECT a.*, u.name as doctor_name, u.email as doctor_email
        FROM appointments a
        JOIN users u ON a.doctor_id = u.id
        WHERE a.id = ?
      `, [result.insertId]);

      res.status(201).json(appointment[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update appointment status
router.patch('/:id/status',
  [
    auth,
    body('status').isIn(['scheduled', 'completed', 'cancelled']).withMessage('Invalid status')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Get appointment and check authorization
      const [appointments] = await db.query(
        'SELECT * FROM appointments WHERE id = ?',
        [req.params.id]
      );

      if (appointments.length === 0) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const appointment = appointments[0];

      // Check authorization
      const [users] = await db.query(
        'SELECT role FROM users WHERE id = ?',
        [req.user.userId]
      );
      
      const user = users[0];
      if (user.role !== 'doctor' && appointment.patient_id !== req.user.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Update status
      await db.query(
        'UPDATE appointments SET status = ? WHERE id = ?',
        [req.body.status, req.params.id]
      );

      res.json({ ...appointment, status: req.body.status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router; 