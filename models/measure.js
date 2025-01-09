const mongoose = require('mongoose');

const measureSubmissionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: new Date()
    },
    meter_number: {
        type: String,
        required: true
    },
    meter_category: {
        type: String,
        required: true
    }, 
    longitude: {
        type: Number,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    measure_value: {
        type: Number,
        required: true
    },
    measure_unit: {
        type: String,
        required: true
    },       
    pictureUrl: {
        type: String,
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const measureSubmission = mongoose.model('Measure', measureSubmissionSchema);

module.exports = measureSubmission;
