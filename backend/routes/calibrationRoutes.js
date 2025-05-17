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


// Get request for calibration data by userId
router.get('/:userId', async (req, res) => {
    try {
      const data = await Calibration.find({ userId: req.params.userId });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch calibration data' });
    }
  });
  
  module.exports = router;


