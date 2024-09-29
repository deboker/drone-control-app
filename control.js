const express = require('express');
const dgram = require('dgram');
const bodyParser = require('body-parser');

const app = express();
const drone = dgram.createSocket('udp4');

const DRONE_IP = '192.168.10.1';
const DRONE_PORT = 8889;

app.use(express.static('public')); // Serve static files from the public folder
app.use(bodyParser.json()); // Parse incoming JSON requests

// Function to send commands to the drone
function sendCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Sending command: ${command}`);
    drone.send(command, 0, command.length, DRONE_PORT, DRONE_IP, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Drone response handling
drone.on('message', (message) => {
  console.log(`Drone response: ${message}`);
});

// Route to handle command requests from the front-end
app.post('/command', (req, res) => {
  const command = req.body.command;
  sendCommand(command)
    .then(() => res.json({ status: 'success' }))
    .catch(err => res.json({ status: 'error', message: err.message }));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Connect to the Tello drone
sendCommand('command')
  .then(() => console.log('Drone is ready for commands.'))
  .catch(err => console.error('Error initializing drone:', err));
