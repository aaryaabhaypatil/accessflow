const express = require('express');
const cors = require('cors');
const fs = require("fs");
const app = express();

// Allow large payloads
app.use(express.json({ limit: '100mb' }));
app.use(cors());

// Save-gaze route
app.post('/save-gaze', (req, res) => {
  try {
    // Append the JSON data as a new line
    // ✅ Log glasses reflection info
    if (req.body.glassesReflection) {
      console.log("👓 Glasses Reflection Data Received:");
      console.log("  Has Glasses:", req.body.glassesReflection.hasGlasses);
      console.log("  Intensity:", req.body.glassesReflection.reflectionIntensity?.toFixed(2) + "%");
      console.log("  Samples:", req.body.glassesReflection.samplesCollected);
    } else {
      console.log("⚠️ No glasses reflection data in this submission");
    }
    fs.appendFileSync("frontend/received_data.json", JSON.stringify(req.body) + "\n");  
    console.log("✅ Received data:", req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
