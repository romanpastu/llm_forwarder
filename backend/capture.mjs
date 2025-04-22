// capture.js
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import screenshot from 'screenshot-desktop';

// SETTINGS
const STORAGE_FILE = './storage.json';
const IMAGES_FOLDER = './images';
const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const VISION_MODEL_NAME = 'gemma3:27b';
const CODING_MODEL_NAME = 'qwen2.5-coder:32b';
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

// Ask Vision Model for OCR and problem analysis
async function askVisionModel(base64Image) {
  const response = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: VISION_MODEL_NAME,
      prompt: 'Please analyze this screenshot and describe the coding problem or question you see. Focus on extracting the exact problem statement, requirements, and any relevant details. Be precise and structured in your analysis.',
      images: [base64Image],
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Vision model error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

// Ask Coding Model to solve the problem
async function askCodingModel(problemDescription) {
  const response = await fetch(OLLAMA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CODING_MODEL_NAME,
      prompt: `Based on the following problem description which is in JS / TS or REACT, please provide a complete solution. Include code examples, explanations, and best practices where applicable.  The code must be between \`\`\` and \`\`\` tags.\n\nProblem Description:\n${problemDescription}`,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`Coding model error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
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

      // First, use vision model to analyze the problem
      const problemDescription = await askVisionModel(base64Img);
      console.log(`Vision model analysis: ${problemDescription}`);

      // Then, use coding model to solve the problem
      const solution = await askCodingModel(problemDescription);
      console.log(`Coding model solution: ${solution}`);

      const storage = loadStorage();
      storage.push({
        timestamp: Date.now(),
        screenshot: screenshotFile,
        problemDescription: problemDescription,
        solution: solution
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

