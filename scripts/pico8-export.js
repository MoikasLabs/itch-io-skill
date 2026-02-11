#!/usr/bin/env node
/**
 * PICO-8 Export & itch.io Publisher
 * 
 * Batch export PICO-8 carts and verify builds.
 * 
 * Usage:
 *   node pico8-export.js <carts-directory>
 * 
 * Requires: PICO-8 installed at standard location
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PICO8_PATHS = [
  '/Applications/pico8.app/Contents/MacOS/pico8',  // macOS
  'C:/Program Files (x86)/PICO-8/pico8.exe',       // Windows
  '/home/${user}/pico8/pico8',                     // Linux
  '/usr/bin/pico8'
];

function findPico8() {
  for (const p of PICO8_PATHS) {
    const expanded = p.replace('${user}', require('os').userInfo().username);
    if (fs.existsSync(expanded)) return expanded;
  }
  return null;
}

function runPico8(args) {
  const pico8 = findPico8();
  if (!pico8) {
    throw new Error('PICO-8 not found. Install from https://www.lexaloffle.com/pico-8.php');
  }
  return execSync(`"${pico8}" ${args}`, { encoding: 'utf8' });
}

function exportCart(cartPath, outputDir) {
  const base = path.basename(cartPath, '.p8.png').replace('.p8', '');
  const cartDir = path.dirname(cartPath);
  
  console.log(`\n🎮 Exporting: ${base}`);
  
  // Change to cart directory for PICO-8
  process.chdir(cartDir);
  
  // Export HTML5
  try {
    runPico8(`-x "${cartPath}" -export index.html`);
    console.log('   ✅ HTML5 exported');
  } catch (e) {
    console.log('   ❌ HTML5 export failed:', e.message);
    return null;
  }
  
  // Verify html/ directory was created
  const htmlDir = path.join(cartDir, 'html');
  if (!fs.existsSync(htmlDir)) {
    console.log('   ❌ HTML directory not created');
    return null;
  }
  
  // Copy to output
  const destDir = path.join(outputDir, base);
  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
  fs.mkdirSync(destDir, { recursive: true });
  
  // Copy HTML files
  fs.readdirSync(htmlDir).forEach(file => {
    fs.copyFileSync(path.join(htmlDir, file), path.join(destDir, file));
  });
  
  // Clean up
  fs.rmSync(htmlDir, { recursive: true });
  
  console.log(`   ✅ Copied to ${destDir}`);
  return destDir;
}

function generateButlerCommands(outputDir, user) {
  const dirs = fs.readdirSync(outputDir).filter(f => 
    fs.statSync(path.join(outputDir, f)).isDirectory()
  );
  
  console.log('\n📦 Butler commands to publish:\n');
  dirs.forEach(dir => {
    console.log(`butler push "${outputDir}/${dir}" "${user}/${dir}:html5"`);
  });
}

function main() {
  const cartsDir = process.argv[2];
  const itchUser = process.argv[3];
  
  if (!cartsDir) {
    console.log('Usage: node pico8-export.js <carts-directory> [itch-username]');
    console.log('');
    console.log('Example:');
    console.log('  node pico8-export.js ./my-carts myusername');
    console.log('');
    console.log('Outputs itch.io-ready HTML5 builds and generates butler commands');
    process.exit(1);
  }

  if (!fs.existsSync(cartsDir)) {
    console.error(`Directory not found: ${cartsDir}`);
    process.exit(1);
  }

  // Find all .p8 and .p8.png files
  const carts = fs.readdirSync(cartsDir)
    .filter(f => f.endsWith('.p8') || f.endsWith('.p8.png'))
    .map(f => path.join(cartsDir, f));
  
  if (carts.length === 0) {
    console.log('No PICO-8 carts found (.p8 or .p8.png)');
    process.exit(1);
  }
  
  console.log(`Found ${carts.length} cart(s)\n`);
  
  const outputDir = path.join(cartsDir, '../itch-ready');
  fs.mkdirSync(outputDir, { recursive: true });
  
  const exported = [];
  for (const cart of carts) {
    const result = exportCart(cart, outputDir);
    if (result) exported.push(result);
  }
  
  console.log(`\n✅ Exported ${exported.length}/${carts.length} carts`);
  console.log(`   Output: ${outputDir}`);
  
  if (itchUser) {
    generateButlerCommands(outputDir, itchUser);
  } else {
    console.log('\n💡 Pass your itch.io username to generate butler commands');
  }
}

main();
