#!/usr/bin/env node
/**
 * itch.io Steam Key Manager
 * 
 * Upload and audit Steam keys for your games.
 * 
 * Usage:
 *   export ITCH_IO_API_KEY="your-key"
 *   node steam-keys.js <game-id> <command> [args]
 * 
 * Commands:
 *   upload <keys.csv>     Upload keys from CSV file
 *   count                 Show key inventory stats
 *   audit                 List all active keys (sensitive!)
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ITCH_IO_API_KEY;

async function api(endpoint, opts = {}) {
  const url = `https://api.itch.io${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Authorization': API_KEY },
    ...opts
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function uploadKeys(gameId, csvPath) {
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const keys = lines.map(line => line.split(',')[0].trim()).filter(k => k);

  console.log(`📤 Uploading ${keys.length} keys for game ${gameId}...`);

  // Note: Itch.io API uses multipart/form-data for CSV upload
  const FormData = require('form-data');
  const form = new FormData();
  form.append('keys', fs.createReadStream(csvPath));

  const res = await fetch(`https://api.itch.io/games/${gameId}/steam_keys`, {
    method: 'POST',
    headers: { 'Authorization': API_KEY, ...form.getHeaders() },
    body: form
  });

  if (res.ok) {
    const result = await res.json();
    console.log(`✅ Uploaded: ${result.added || keys.length} keys`);
    if (result.duplicates) console.log(`⚠️ Duplicates skipped: ${result.duplicates}`);
  } else {
    console.error(`❌ Upload failed: ${await res.text()}`);
  }
}

async function countKeys(gameId) {
  try {
    const { steam_keys } = await api(`/games/${gameId}/steam_keys`);
    const total = steam_keys.length;
    const claimed = steam_keys.filter(k => k.claimed).length;
    const available = total - claimed;

    console.log(`\n🎮 Game ID: ${gameId}`);
    console.log(`   Total: ${total}`);
    console.log(`   Claimed: ${claimed}`);
    console.log(`   Available: ${available}`);
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
  }
}

async function auditKeys(gameId) {
  console.log('⚠️  This will show all raw keys. Keep output secure!\n');
  try {
    const { steam_keys } = await api(`/games/${gameId}/steam_keys`);
    steam_keys.forEach(k => {
      const status = k.claimed ? `✅ ${k.claimed_at}` : '⏳ Available';
      const user = k.claimed_by ? `by @${k.claimed_by.username}` : '';
      console.log(`${k.key} | ${status} ${user}`);
    });
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
  }
}

async function main() {
  const [gameId, command, arg] = process.argv.slice(2);

  if (!API_KEY) {
    console.error('Set ITCH_IO_API_KEY environment variable');
    process.exit(1);
  }

  if (!gameId || !command) {
    console.log('Usage: node steam-keys.js <game-id> <command> [args]');
    console.log('');
    console.log('Commands:');
    console.log('  upload <keys.csv>  Upload keys from CSV');
    console.log('  count              Show key inventory stats');
    console.log('  audit              List all keys (sensitive)');
    console.log('');
    console.log('CSV format: AAAAA-BBBBB-CCCCC,Note');
    process.exit(1);
  }

  switch (command) {
    case 'upload':
      await uploadKeys(gameId, arg);
      break;
    case 'count':
      await countKeys(gameId);
      break;
    case 'audit':
      await auditKeys(gameId);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
