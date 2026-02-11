#!/usr/bin/env node
/**
 * itch.io Game Analytics
 * 
 * Fetches download and view stats for your games.
 * 
 * Usage:
 *   export ITCH_IO_API_KEY="your-api-key"
 *   node analytics.js [game-id]
 */

async function fetchItchApi(endpoint, apiKey) {
  const res = await fetch(`https://api.itch.io${endpoint}`, {
    headers: { 'Authorization': apiKey }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const apiKey = process.env.ITCH_IO_API_KEY;
  const gameId = process.argv[2];

  if (!apiKey) {
    console.error('Set ITCH_IO_API_KEY environment variable');
    process.exit(1);
  }

  try {
    if (gameId) {
      const { game } = await fetchItchApi(`/games/${gameId}`, apiKey);
      console.log(`\n🎮 ${game.title}`);
      console.log(`   Views: ${game.views_count}`);
      console.log(`   Downloads: ${game.downloads_count}`);
      console.log(`   Purchases: ${game.purchases_count || 0}`);
      if (game.price) console.log(`   Price: $${game.price / 100}`);
    } else {
      const { games } = await fetchItchApi('/games', apiKey);
      console.log(`\nFound ${games.length} game(s):\n`);
      games.forEach(g => {
        console.log(`🎮 ${g.title} (ID: ${g.id})`);
        console.log(`   👁 Views: ${g.views_count} | ⬇ Downloads: ${g.downloads_count}`);
      });
    }
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
