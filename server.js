const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const dataFile = path.join(__dirname, "gaze_dataset.json");

// Ensure dataset file exists
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([]));
}

// Endpoint to append gaze data
app.post("/save-gaze", (req, res) => {
  const newData = req.body;

  if (!Array.isArray(newData)) {
    return res.status(400).json({ error: "Data must be an array" });
  }

  const existing = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const updated = existing.concat(newData);

  fs.writeFileSync(dataFile, JSON.stringify(updated, null, 2));

  res.json({ success: true, totalRecords: updated.length });
});

// Serve frontend (if in /public folder)
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
