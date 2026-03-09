const http = require('http');
const express = require('express');
const dgram = require('dgram');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const drone = dgram.createSocket('udp4');

const DRONE_IP = '192.168.10.1';
const DRONE_PORT = 8889;
const HTTP_PORT = process.env.PORT || 3000; // allows hosting providers

app.use(express.static('public')); // Serve static files from the public folder
app.use(bodyParser.json()); // Parse incoming JSON requests

// Function to send commands to the drone over UDP
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
  const response = message.toString();
  if (response === 'ok') {
    console.log(`Drone response: ${response}`);
  } else if (response.startsWith('error')) {
    console.log(`Drone response: ${response}`);
  } else {
    console.log(`Unexpected drone response: ${response}`);
  }
});

// Route to handle command requests from the front-end
app.post('/command', async (req, res) => {
  const command = req.body.command;

  try {
    // If the command is 'command', just send it
    if (command === 'command') {
      await sendCommand(command);
      console.log('Entered command mode.');
      return res.json({ status: 'success' });
    }

    // Ensure the drone is in command mode before sending other commands
    await sendCommand('command');
    console.log('Ensured command mode.');
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds

    // Send the actual command
    await sendCommand(command);
    console.log(`Executed command: ${command}`);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Error:', err);
    res.json({ status: 'error', message: err.message });
  }
});

// WebSocket server for video stream (runs on same HTTP server)
const wss = new WebSocket.Server({ server, path: '/video' });

wss.on('connection', (ws) => {
  console.log('Client connected for video stream');

  // Spawn an FFmpeg process to capture the video stream from Tello drone
  const ffmpeg = spawn('ffmpeg', [
    '-i', 'udp://0.0.0.0:11111',
    '-f', 'mpegts',
    '-codec:v', 'mpeg1video',
    '-s', '640x480',
    '-b:v', '800k',
    '-r', '30',
    '-'
  ]);

  // Pipe FFmpeg output to the WebSocket
  ffmpeg.stdout.on('data', (data) => {
    ws.send(data);
  });

  // Log any errors from FFmpeg
  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg stderr: ${data}`);
  });

  // Handle FFmpeg process close event
  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
  });

  // Handle WebSocket close event (when the client disconnects)
  ws.on('close', () => {
    console.log('Client disconnected');
    ffmpeg.kill('SIGINT');
  });
});

// Start the server (HTTP + WebSocket)
server.listen(HTTP_PORT, () => {
  console.log(`Server is running on http://localhost:${HTTP_PORT}`);
  console.log(`Video WebSocket on ws://localhost:${HTTP_PORT}/video`);
});

// Initialize drone by entering command mode and starting the video stream
sendCommand('command')
  .then(() => {
    console.log('Drone is in command mode.');
    return sendCommand('streamon'); // Start video stream
  })
  .then(() => {
    console.log('Video stream is on.');
  })
  .catch((err) => console.error('Error initializing drone:', err));
