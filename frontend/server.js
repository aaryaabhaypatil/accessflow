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
    fs.appendFileSync("frontend/received_data.json", JSON.stringify(req.body) + "\n");  
    console.log("✅ Received data:", req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error saving data:", err);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
