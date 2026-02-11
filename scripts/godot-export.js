#!/usr/bin/env node
/**
 * Godot Export Verifier & Publisher
 * 
 * Verifies Godot export folders and generates butler commands.
 * 
 * Usage:
 *   node godot-export.js <build-directory> <itch-username/game>
 * 
 * Example:
 *   node godot-export.js ./build user123/my-game
 */

const fs = require('fs');
const path = require('path');

const PLATFORMS = {
  windows: {
    channel: 'windows',
    files: ['.exe'],
    name: 'Windows Desktop'
  },
  linux: {
    channel: 'linux',
    files: [''],
    name: 'Linux/X11'
  },
  macos: {
    channel: 'osx',
    files: ['.app', '.zip'],
    name: 'macOS'
  },
  web: {
    channel: 'html5',
    files: ['index.html'],
    name: 'Web (HTML5)'
  },
  android: {
    channel: 'android',
    files: ['.apk', '.aab'],
    name: 'Android'
  }
};

function detectPlatform(dir) {
  const files = fs.readdirSync(dir);
  
  // Check for index.html (Web export)
  if (files.includes('index.html')) return 'web';
  
  // Check for .exe
  if (files.some(f => f.endsWith('.exe'))) return 'windows';
  
  // Check for .app bundle
  if (files.some(f => f.endsWith('.app')) || files.some(f => f.endsWith('.zip'))) {
    // Verify it's a mac export
    const zip = files.find(f => f.endsWith('.zip'));
    if (zip && (zip.includes('mac') || zip.includes('osx'))) return 'macos';
    // Check .app
    const app = files.find(f => f.endsWith('.app'));
    if (app) return 'macos';
  }
  
  // Check for Android
  if (files.some(f => f.endsWith('.apk') || f.endsWith('.aab'))) return 'android';
  
  // Linux fallback - look for executable without extension
  const executables = files.filter(f => !f.includes('.') && fs.statSync(path.join(dir, f)).isFile());
  if (executables.length > 0) return 'linux';
  
  return null;
}

function checkCORS(dir) {
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) return false;
  
  const content = fs.readFileSync(indexPath, 'utf8');
  const hasCOI = content.includes('coi-serviceworker');
  
  if (!hasCOI) {
    console.log(`   ⚠️  Web export missing CORS fix (coi-serviceworker.js)`);
    console.log(`   Get it from: https://github.com/gzuidhof/coi-serviceworker`);
  }
  
  return hasCOI;
}

function scanBuildDir(buildDir) {
  const platforms = {};
  
  // Check if buildDir contains platform subdirectories
  const entries = fs.readdirSync(buildDir)
    .map(f => path.join(buildDir, f))
    .filter(f => fs.statSync(f).isDirectory());
  
  for (const entry of entries) {
    const name = path.basename(entry).toLowerCase();
    const platform = detectPlatform(entry);
    
    if (platform) {
      platforms[platform] = entry;
      console.log(`✅ ${PLATFORMS[platform].name}: ${name}/`);
      
      if (platform === 'web') {
        checkCORS(entry);
      }
    } else {
      console.log(`❓ Unknown platform: ${name}/`);
    }
  }
  
  return platforms;
}

function generateCommands(platforms, target) {
  console.log('\n📦 Butler commands:\n');
  
  Object.entries(platforms).forEach(([plat, dir]) => {
    const channel = PLATFORMS[plat].channel;
    console.log(`butler push "${dir}" "${target}:${channel}"`);
  });
  
  console.log('\n# Check status after upload:');
  console.log(`butler status "${target}"`);
}

function main() {
  const buildDir = process.argv[2];
  const target = process.argv[3]; // username/game
  
  if (!buildDir || !target) {
    console.log('Usage: node godot-export.js <build-directory> <itch-username/game>');
    console.log('');
    console.log('Example:');
    console.log('  node godot-export.js ./build myname/my-game');
    console.log('');
    console.log('Expected build structure:');
    console.log('  build/');
    console.log('    ├── windows/    (.exe)');
    console.log('    ├── linux/      (executable)');
    console.log('    ├── macos/      (.app or .zip)');
    console.log('    └── web/        (index.html)');
    process.exit(1);
  }
  
  if (!fs.existsSync(buildDir)) {
    console.error(`❌ Directory not found: ${buildDir}`);
    process.exit(1);
  }
  
  console.log(`🔍 Scanning: ${buildDir}\n`);
  
  const platforms = scanBuildDir(buildDir);
  
  if (Object.keys(platforms).length === 0) {
    console.log('❌ No Godot exports detected');
    process.exit(1);
  }
  
  console.log(`\n✅ Found ${Object.keys(platforms).length} platform(s)`);
  generateCommands(platforms, target);
}

main();
