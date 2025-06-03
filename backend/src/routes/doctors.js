const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// GET /api/doctors - Get all doctors
router.get('/', auth, async (req, res) => {
    try {
        console.log('Getting all doctors...');
        console.log('Authenticated user:', {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role
        });
        
        const doctors = await Doctor.find()
            .populate('user', 'name email')
            .lean()
            .exec();
            
        console.log('Doctors found:', doctors);
        res.json(doctors);
    } catch (error) {
        console.error('Error in GET /api/doctors:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET /api/doctors/:id - Get a specific doctor
router.get('/:id', auth, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('user', 'name email')
            .lean()
            .exec();
            
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        console.error('Error in GET /api/doctors/:id:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// POST /api/doctors - Create a new doctor
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating new doctor...');
        console.log('Request body:', req.body);
        
        const doctor = new Doctor({
            user: req.user._id,
            ...req.body
        });

        console.log('Doctor to save:', doctor);
        await doctor.save();
        
        const savedDoctor = await doctor.populate('user', 'name email');
        console.log('Saved doctor:', savedDoctor);
        
        res.status(201).json(savedDoctor);
    } catch (error) {
        console.error('Error in POST /api/doctors:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router; 