const express = require('express');
const router = express.Router();
const Calibration = require('../models/CalibrationModel')


// Post request to save calibration data
router.post('/', async (req, res) => {
    try {
      const calibration = new Calibration(req.body);
      await calibration.save();
      res.status(201).json({ message: 'Calibration data saved' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save calibration data' });
    }
});



