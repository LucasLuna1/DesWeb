const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    allergies: [{
        type: String,
        trim: true
    }],
    chronicConditions: [{
        condition: String,
        diagnosedDate: Date,
        medications: [String],
        notes: String
    }],
    surgeries: [{
        name: String,
        date: Date,
        hospital: String,
        surgeon: String,
        notes: String
    }],
    familyHistory: [{
        condition: String,
        relationship: String,
        notes: String
    }],
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    height: {
        value: Number,
        unit: {
            type: String,
            enum: ['cm', 'ft'],
            default: 'cm'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'lb'],
            default: 'kg'
        }
    },
    medications: [{
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
        endDate: Date,
        prescribed: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor'
        }
    }],
    immunizations: [{
        name: String,
        date: Date,
        nextDueDate: Date,
        notes: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema); 