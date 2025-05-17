const mongoose = require('mongoose');

const CalibrationSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true
    },
    calibrationPoints: {
      type: Array,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  