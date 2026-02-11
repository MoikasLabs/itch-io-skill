#!/usr/bin/env node
/**
 * Generate HTML5 Game Template for itch.io
 * 
 * Creates a minimal HTML5 game structure ready for butler upload.
 * 
 * Usage:
 *   node template-html5.js <game-name> [output-dir]
 */

const fs = require('fs');
const path = require('path');

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: system-ui, sans-serif;
    }
    canvas {
      background: #16213e;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      max-width: 100%;
      max-height: 100vh;
    }
    #info {
      position: absolute;
      bottom: 10px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="800" height="600"></canvas>
  <script src="game.js"></script>
</body>
</html>`;

const GAME_JS = `// {{TITLE}} - HTML5 Game for itch.io

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
const state = {
  lastTime: 0,
  running: true
};

// Initialize
function init() {
  console.log('{{TITLE}} initialized');
  requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop(timestamp) {
  if (!state.running) return;
  
  const deltaTime = timestamp - state.lastTime;
  state.lastTime = timestamp;
  
  update(deltaTime);
  render();
  
  requestAnimationFrame(gameLoop);
}

// Update game logic
function update(dt) {
  // TODO: Add your game logic
}

// Render the game
function render() {
  // Clear canvas
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw placeholder text
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 32px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('{{TITLE}}', canvas.width / 2, canvas.height / 2 - 20);
  
  ctx.fillStyle = '#fff';
  ctx.font = '16px system-ui';
  ctx.fillText('Ready for itch.io', canvas.width / 2, canvas.height / 2 + 20);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
  // TODO: Add keyboard controls
  console.log('Key pressed:', e.key);
});

// Handle gamepad (for itch.io embedding)
window.addEventListener('gamepadconnected', (e) => {
  console.log('Gamepad connected:', e.gamepad.id);
});

// Start the game
init();
`;

const PACKAGE_JSON = `{
  "name": "{{NAME}}",
  "version": "1.0.0",
  "description": "HTML5 game for itch.io",
  "scripts": {
    "build": "mkdir -p dist && cp index.html game.js dist/",
    "publish": "node -e \"console.log('Run: butler push dist USERNAME/GAME:html5')\""
  },
  "keywords": ["game", "html5", "itch.io"],
  "license": "MIT"
}`;

const PUBLISH_CONFIG = `{
  "user": "YOUR_ITCH_USERNAME",
  "game": "{{NAME}}",
  "channels": {
    "html5": "./dist"
  },
  "version": "1.0.0",
  "ignore": ["*.map", "node_modules/**"]
}`;

function generate(gameName, outputDir) {
  const dir = outputDir || `./${gameName}`;
  
  if (fs.existsSync(dir)) {
    console.error(`Directory already exists: ${dir}`);
    process.exit(1);
  }

  fs.mkdirSync(dir, { recursive: true });

  const files = [
    { name: 'index.html', content: HTML_TEMPLATE },
    { name: 'game.js', content: GAME_JS },
    { name: 'package.json', content: PACKAGE_JSON },
    { name: 'itch-publish.json', content: PUBLISH_CONFIG }
  ];

  files.forEach(file => {
    const content = file.content
      .replace(/\{\{TITLE\}\}/g, gameName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
      .replace(/\{\{NAME\}\}/g, gameName);
    
    fs.writeFileSync(path.join(dir, file.name), content);
    console.log(`Created: ${file.name}`);
  });

  console.log(`\n✅ Template created in: ${dir}`);
  console.log('\nNext steps:');
  console.log(`  cd ${dir}`);
  console.log('  npm run build');
  console.log('  # Edit itch-publish.json with your username');
  console.log('  # Then: butler push dist YOUR_USERNAME/GAME-NAME:html5');
}

const gameName = process.argv[2];
const outputDir = process.argv[3];

if (!gameName) {
  console.log('Usage: node template-html5.js <game-name> [output-dir]');
  console.log('');
  console.log('Example:');
  console.log('  node template-html5.js my-awesome-game');
  process.exit(1);
}

generate(gameName, outputDir);
