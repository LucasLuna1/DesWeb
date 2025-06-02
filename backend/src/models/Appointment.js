const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
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