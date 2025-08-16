import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.post('/save-gaze', (req, res) => {
  const data = req.body;
  fs.writeFileSync('received_data.json', JSON.stringify(data, null, 2));
  res.json({ status: 'ok' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
