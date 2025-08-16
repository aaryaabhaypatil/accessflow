const express = require('express');
const cors = require('cors');

const app = express();

// Allow large payloads
app.use(express.json({ limit: '100mb' }));
app.use(cors());

// Your save-gaze route here
app.post('/save-gaze', (req, res) => {
  console.log(req.body);
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on port 3000'));
