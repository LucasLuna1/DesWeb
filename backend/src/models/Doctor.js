const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    speciality: {
        type: String,
        required: true,
        trim: true
    },
    license: {
        type: String,
        required: true,
        unique: true
    },
    experience: {
        type: Number,
        default: 0
    },
    consultationFee: {
        type: Number,
        required: true
    },
    schedule: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    }],
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
doctorSchema.index({ user: 1 }, { unique: true });
doctorSchema.index({ license: 1 }, { unique: true });

// Pre-save middleware
doctorSchema.pre('save', function(next) {
    console.log('Saving doctor:', this);
    next();
});

// Pre-find middleware
doctorSchema.pre('find', function() {
    console.log('Finding doctors with query:', this.getQuery());
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor; 