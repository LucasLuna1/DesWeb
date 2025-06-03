const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['first-visit', 'follow-up', 'consultation', 'emergency'],
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String,
    default: ''
  },
  prescription: [{
    medicine: {
      type: String,
      required: true
    },
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for querying appointments
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });

// Virtual for formatting date
appointmentSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString();
});

// Method to check if time slot is available
appointmentSchema.statics.isTimeSlotAvailable = async function(doctorId, date, time) {
  const existingAppointment = await this.findOne({
    doctor: doctorId,
    date: date,
    time: time,
    status: { $ne: 'cancelled' }
  });
  return !existingAppointment;
};

module.exports = mongoose.model('Appointment', appointmentSchema); 