// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000; // or whatever port you prefer
const STORAGE_FILE = path.join(__dirname, 'storage.json');
const IMAGES_FOLDER = path.join(__dirname, 'images');

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json());

// Serve static images
app.use('/images', express.static(IMAGES_FOLDER));

// Endpoint to get all entries
app.get('/entries', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(STORAGE_FILE));
    res.json(data);
  } catch (error) {
    console.error('Failed to read storage.json:', error.message);
    res.status(500).json({ error: 'Failed to load entries' });
  }
});

// Health check (optional)
app.get('/', (req, res) => {
  res.send('Server is up and running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
