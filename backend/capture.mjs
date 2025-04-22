// capture.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import screenshot from 'screenshot-desktop';

// SETTINGS
const STORAGE_FILE = './storage.json';
const IMAGES_FOLDER = './images';
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'gemma3:27b-it-qat';
const INTERVAL_MS = 30000; // 30 seconds

// Ensure storage paths exist
if (!fs.existsSync(IMAGES_FOLDER)) {
  fs.mkdirSync(IMAGES_FOLDER);
}
if (!fs.existsSync(STORAGE_FILE)) {
  fs.writeFileSync(STORAGE_FILE, '[]');
}

// Load existing storage
function loadStorage() {
  return JSON.parse(fs.readFileSync(STORAGE_FILE));
}

// Save storage
function saveStorage(data) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
}

// Capture screenshot
async function captureScreenshot() {
  const filename = `screenshot-${Date.now()}.png`;
  const filepath = path.join(IMAGES_FOLDER, filename);
  const img = await screenshot({ screen: 0 }); // 0 is usually primary monitor
  fs.writeFileSync(filepath, img);
  return filename;
}

// Ask Ollama
async function askOllama(base64Image) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt: 'IM sending you screenshots of coding problems, your goal is to describe the problem that you are solving, and solve it, so give me the answer to it. Be as structured as possible so the output is easy to read. Its mostly coding challenges so you must solve them, but it might also be react or javascript questions, in this case you must give me the correct answer, in the screen you might see more than one together so maintain a structure answering',
      images: [base64Image],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response; // <-- note: `response`, not `message.content`
}


// Convert image to Base64
function imageToBase64(filepath) {
  const imgBuffer = fs.readFileSync(filepath);
  return imgBuffer.toString('base64');
}

// Main loop
async function mainLoop() {
  console.log('Starting screenshot capture...');

  while (true) {
    try {
      const screenshotFile = await captureScreenshot();
      console.log(`Captured: ${screenshotFile}`);

      const imgPath = path.join(IMAGES_FOLDER, screenshotFile);
      const base64Img = imageToBase64(imgPath);

      const aiResponse = await askOllama(base64Img);
      console.log(`Ollama response: ${aiResponse}`);

      const storage = loadStorage();
      storage.push({
        timestamp: Date.now(),
        screenshot: screenshotFile,
        response: aiResponse
      });
      saveStorage(storage);

    } catch (error) {
      console.error('Error during capture cycle:', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }
}

// Start!
mainLoop();

