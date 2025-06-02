const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../config/db');

// Get all doctors
router.get('/', auth, async (req, res) => {
  try {
    const [doctors] = await db.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE role = 'doctor' 
      ORDER BY name ASC
    `);
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const [doctors] = await db.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE id = ? AND role = 'doctor'
    `, [req.params.id]);
    
    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctors[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get doctor's schedule
router.get('/:id/schedule', auth, async (req, res) => {
  try {
    const [doctors] = await db.query(
      'SELECT id FROM users WHERE id = ? AND role = "doctor"',
      [req.params.id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get all appointments for the doctor for the next 7 days
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekDate = nextWeek.toISOString().split('T')[0];

    const [appointments] = await db.query(`
      SELECT * FROM appointments 
      WHERE doctor_id = ? 
      AND date BETWEEN ? AND ?
      AND status != 'cancelled'
      ORDER BY date ASC, time ASC
    `, [req.params.id, today, nextWeekDate]);

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 