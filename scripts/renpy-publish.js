#!/usr/bin/env node
/**
 * Ren'Py Build Checker & Publisher
 * 
 * Verifies Ren'Py distributions and generates butler commands.
 * 
 * Usage:
 *   node renpy-publish.js <build-directory> <itch-username/game>
 * 
 * Example:
 *   node renpy-publish.js ./build user123/my-vn
 */

const fs = require('fs');
const path = require('path');

const PLATFORMS = {
  pc: {
    channel: 'windows',
    name: 'Windows',
    check: (files) => files.some(f => f.endsWith('.exe') && !f.includes('mac'))
  },
  mac: {
    channel: 'osx',
    name: 'macOS',
    check: (files) => files.some(f => f.endsWith('.app') || f.includes('mac') || f.includes('-mac'))
  },
  linux: {
    channel: 'linux',
    name: 'Linux',
    check: (files) => files.some(f => f.toLowerCase().includes('linux') && !f.includes('.exe'))
  },
  web: {
    channel: 'html5',
    name: 'Web',
    check: (files) => files.includes('index.html') || files.some(f => f.endsWith('web.zip'))
  }
};

function detectPlatform(dir) {
  const files = fs.readdirSync(dir);
  
  for (const [key, plat] of Object.entries(PLATFORMS)) {
    if (plat.check(files)) return key;
  }
  
  // Heuristic: directory name hints
  const name = path.basename(dir).toLowerCase();
  if (name.includes('win')) return 'pc';
  if (name.includes('mac')) return 'mac';
  if (name.includes('linux')) return 'linux';
  if (name.includes('web')) return 'web';
  
  return null;
}

function checkWebBuild(dir) {
  const indexPath = path.join(dir, 'index.html');
  if (!fs.existsSync(indexPath)) return false;
  
  const content = fs.readFileSync(indexPath, 'utf8');
  const size = fs.statSync(indexPath).size;
  
  console.log(`   📄 index.html: ${(size / 1024).toFixed(1)} KB`);
  
  // Check for Pyodide (WASM) indicators
  if (content.includes('pyodide') || content.includes('renpy-web')) {
    console.log(`   ✅ Ren'Py Web (Pyodide WASM)`);
  }
  
  // Check file count (Ren'Py web is typically many files)
  const allFiles = fs.readdirSync(dir);
  console.log(`   📁 ${allFiles.length} files total`);
  
  return true;
}

function checkDesktopBuild(dir, platform) {
  const files = fs.readdirSync(dir);
  
  // Look for launcher
  const launcher = files.find(f => 
    platform === 'pc' ? f.endsWith('.exe') && !f.includes('mac') :
    platform === 'mac' ? f.endsWith('.app') || f.endsWith('mac.zip') :
    !f.includes('.') // Linux executables typically have no extension
  );
  
  if (launcher) {
    console.log(`   🚀 Launcher: ${launcher}`);
  }
  
  // Check for lib/ directory (Ren'Py runtime)
  const hasLib = files.includes('lib') && fs.statSync(path.join(dir, 'lib')).isDirectory();
  if (hasLib) console.log(`   ✅ Ren'Py runtime included (lib/)`);
  
  return true;
}

function scanBuilds(buildDir) {
  const builds = {};
  
  const entries = fs.readdirSync(buildDir)
    .map(f => path.join(buildDir, f))
    .filter(f => fs.statSync(f).isDirectory());
  
  for (const entry of entries) {
    const name = path.basename(entry);
    const platform = detectPlatform(entry);
    
    if (platform) {
      builds[platform] = entry;
      console.log(`\n✅ ${PLATFORMS[platform].name}: ${name}/`);
      
      if (platform === 'web') {
        checkWebBuild(entry);
      } else {
        checkDesktopBuild(entry, platform);
      }
    } else {
      console.log(`\n❓ Unknown: ${name}/`);
    }
  }
  
  return builds;
}

function generateCommands(builds, target) {
  console.log('\n\n📦 Butler commands:\n');
  
  Object.entries(builds).forEach(([plat, dir]) => {
    const channel = PLATFORMS[plat].channel;
    console.log(`butler push "${dir}" "${target}:${channel}"`);
  });
  
  console.log('\n\n# After all uploads:');
  console.log(`butler status "${target}"`);
  console.log('\n# Optional: mark as complete');
  console.log(`# (Do this via itch.io dashboard under Metadata → Completed)');
}

function main() {
  const buildDir = process.argv[2];
  const target = process.argv[3];
  
  if (!buildDir || !target) {
    console.log('Usage: node renpy-publish.js <build-directory> <itch-username/game>');
    console.log('');
    console.log('Example:');
    console.log('  node renpy-publish.js ./build myname/my-visual-novel');
    console.log('');
    console.log('Build from Ren'Py Launcher → Build Distributions');
    console.log('');
    console.log('Expected structure:');
    console.log('  build/');
    console.log('    ├── my-game-1.0-pc/       (Windows)');
    console.log('    ├── my-game-1.0-mac/      (macOS)');
    console.log('    ├── my-game-1.0-linux/    (Linux)');
    console.log('    └── my-game-1.0-web/      (HTML5)');
    process.exit(1);
  }
  
  if (!fs.existsSync(buildDir)) {
    console.error(`❌ Directory not found: ${buildDir}`);
    process.exit(1);
  }
  
  console.log(`🔍 Scanning Ren'Py builds: ${buildDir}\n`);
  
  const builds = scanBuilds(buildDir);
  
  if (Object.keys(builds).length === 0) {
    console.log('\n❌ No Ren'Py builds detected');
    console.log('Make sure you\'ve used Ren'Py Launcher → Build Distributions');
    process.exit(1);
  }
  
  console.log(`\n✅ Found ${Object.keys(builds).length} build(s)`);
  generateCommands(builds, target);
}

main();
