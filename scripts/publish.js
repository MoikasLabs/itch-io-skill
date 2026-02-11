#!/usr/bin/env node
/**
 * itch.io Automated Publisher
 * 
 * Publishes game builds to itch.io using the Butler CLI.
 * 
 * Usage:
 *   node publish.js <config.json>
 *   
 * Config format:
 * {
 *   "user": "your-itch-username",
 *   "game": "game-name",
 *   "channels": {
 *     "html5": "./dist",
 *     "windows": "./build/windows",
 *     "osx": "./build/mac",
 *     "linux": "./build/linux"
 *   },
 *   "version": "1.0.0",
 *   "ignore": ["*.map", "node_modules/**"]
 * }
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(msg, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  console.log(`${icons[type] || 'ℹ️'} ${msg}`);
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
  } catch (e) {
    if (!opts.ignoreError) throw e;
    return '';
  }
}

function checkButler() {
  try {
    const version = run('butler -v', { silent: true }).trim();
    log(`Butler version: ${version}`, 'success');
    return true;
  } catch {
    log('Butler not found. Install from https://itch.io/docs/butler/', 'error');
    return false;
  }
}

function pushChannel(user, game, channel, sourcePath, opts = {}) {
  const target = `${user}/${game}:${channel}`;
  
  if (!fs.existsSync(sourcePath)) {
    log(`Source path not found: ${sourcePath}`, 'warn');
    return false;
  }

  let cmd = `butler push "${sourcePath}" "${target}"`;
  
  if (opts.version) cmd += ` --userversion "${opts.version}"`;
  if (opts.dryRun) cmd += ' --dry-run';
  
  if (opts.ignore) {
    opts.ignore.forEach(pattern => {
      cmd += ` --ignore "${pattern}"`;
    });
  }
  
  log(`Pushing ${channel} from ${sourcePath}...`);
  
  try {
    run(cmd);
    log(`${channel} uploaded successfully`, 'success');
    return true;
  } catch (e) {
    log(`Failed to push ${channel}: ${e.message}`, 'error');
    return false;
  }
}

function checkStatus(user, game) {
  log(`Checking status for ${user}/${game}...`);
  try {
    run(`butler status "${user}/${game}"`);
  } catch (e) {
    log('Status check failed', 'warn');
  }
}

async function main() {
  const configPath = process.argv[2];
  
  if (!configPath) {
    console.log('Usage: node publish.js <config.json>');
    console.log('');
    console.log('Example config.json:');
    console.log(JSON.stringify({
      user: 'your-username',
      game: 'my-game',
      channels: { html5: './dist' },
      version: '1.0.0'
    }, null, 2));
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    log(`Config file not found: ${configPath}`, 'error');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (!config.user || !config.game) {
    log('Config must include "user" and "game" fields', 'error');
    process.exit(1);
  }

  if (!checkButler()) {
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) log('DRY RUN MODE - no actual uploads', 'warn');

  const channels = Object.entries(config.channels || {});
  if (channels.length === 0) {
    log('No channels configured', 'warn');
    process.exit(1);
  }

  const results = [];
  for (const [channel, sourcePath] of channels) {
    const success = pushChannel(config.user, config.game, channel, sourcePath, {
      version: config.version,
      ignore: config.ignore,
      dryRun
    });
    results.push({ channel, success });
  }

  console.log('');
  log('=== SUMMARY ===', 'info');
  results.forEach(r => {
    log(`${r.channel}: ${r.success ? '✅ OK' : '❌ FAILED'}`, r.success ? 'success' : 'error');
  });

  checkStatus(config.user, config.game);
}

main().catch(e => {
  log(e.message, 'error');
  process.exit(1);
});
