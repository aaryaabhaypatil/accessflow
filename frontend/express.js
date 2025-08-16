const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // allow all origins (for development)

app.use(express.json());

app.post('/save-gaze', (req, res) => {
    console.log(req.body); // your gaze data
    res.json({ status: 'ok' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
