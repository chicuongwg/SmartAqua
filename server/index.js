const express = require('express');
const mqttClient = require('./mqtt-client');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API endpoint to send command to ESP32
app.post('/api/command', (req, res) => {
  const { command, value } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  const success = mqttClient.sendCommand(command, value);
  
  if (success) {
    res.json({ success: true, message: 'Command sent' });
  } else {
    res.status(500).json({ error: 'Failed to send command' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});