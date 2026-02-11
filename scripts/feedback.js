#!/usr/bin/env node
/**
 * itch.io Feedback Collector
 * 
 * Fetch comments, ratings, and community feedback for your games.
 * 
 * Usage:
 *   export ITCH_IO_API_KEY="your-key"
 *   node feedback.js <game-id> [command]
 * 
 * Commands:
 *   comments           Fetch recent comments
 *   ratings            Get rating breakdown
 *   sentiment          Analyze comment sentiment (basic)
 *   report             Generate full feedback report
 */

const API_KEY = process.env.ITCH_IO_API_KEY;

async function api(endpoint) {
  const res = await fetch(`https://api.itch.io${endpoint}`, {
    headers: { 'Authorization': API_KEY }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function analyzeSentiment(text) {
  // Basic keyword-based sentiment
  const positive = ['love', 'great', 'awesome', 'amazing', 'good', 'fun', 'thanks', 'cool', 'nice', 'perfect', 'excellent'];
  const negative = ['bug', 'broken', 'bad', 'hate', 'terrible', 'awful', 'crash', 'error', 'fix', 'problem', 'issue', 'slow', 'lag'];
  
  const lower = text.toLowerCase();
  let score = 0;
  
  positive.forEach(w => { if (lower.includes(w)) score++; });
  negative.forEach(w => { if (lower.includes(w)) score--; });
  
  if (score > 0) return { label: '😊 Positive', score };
  if (score < 0) return { label: '😞 Negative', score };
  return { label: '😐 Neutral', score: 0 };
}

async function fetchComments(gameId, limit = 20) {
  try {
    const data = await api(`/games/${gameId}/comments`);
    const comments = (data.comments || []).slice(0, limit);
    
    console.log(`\n💬 Recent Comments (${comments.length}):\n`);
    
    comments.forEach(c => {
      const user = c.user?.username || 'Anonymous';
      const date = new Date(c.created_at).toLocaleDateString();
      const sentiment = analyzeSentiment(c.body || '');
      
      console.log(`@${user} · ${date} ${sentiment.label}`);
      console.log(`   "${(c.body || '').substring(0, 120)}${(c.body || '').length > 120 ? '...' : ''}"\n`);
    });
    
    return comments;
  } catch (e) {
    console.error('❌ Could not fetch comments:', e.message);
    // Comments may not be available via API - web scraping fallback noted
    console.log('   Note: Full comment access may require page scraping');
    return [];
  }
}

async function fetchRatings(gameId) {
  try {
    const { game } = await api(`/games/${gameId}`);
    
    console.log(`\n⭐ Ratings for "${game.title}":\n`);
    console.log(`   Average: ${game.rating ? (game.rating / 20).toFixed(1) : 'N/A'}/5`);
    console.log(`   Total ratings: ${game.rating_count || 0}`);
    console.log(`   Views: ${game.views_count || 0}`);
    console.log(`   Downloads: ${game.downloads_count || 0}`);
    console.log(`   Purchases: ${game.purchases_count || 0}`);
    
    return game;
  } catch (e) {
    console.error('❌ Error:', e.message);
    return null;
  }
}

async function sentimentReport(gameId) {
  const comments = await fetchComments(gameId, 50);
  
  if (comments.length === 0) {
    console.log('No comments to analyze');
    return;
  }
  
  let positive = 0, negative = 0, neutral = 0;
  
  comments.forEach(c => {
    const s = analyzeSentiment(c.body || '');
    if (s.score > 0) positive++;
    else if (s.score < 0) negative++;
    else neutral++;
  });
  
  console.log(`\n📊 Sentiment Analysis (${comments.length} comments):\n`);
  console.log(`   😊 Positive: ${positive} (${((positive/comments.length)*100).toFixed(0)}%)`);
  console.log(`   😐 Neutral:  ${neutral} (${((neutral/comments.length)*100).toFixed(0)}%)`);
  console.log(`   😞 Negative: ${negative} (${((negative/comments.length)*100).toFixed(0)}%)`);
  
  // Common keywords
  const allText = comments.map(c => c.body || '').join(' ').toLowerCase();
  const keywords = ['bug', 'crash', 'good', 'love', 'hard', 'easy', 'help', 'level', 'graphics'].filter(k => allText.includes(k));
  
  if (keywords.length > 0) {
    console.log(`\n🔍 Common keywords: ${keywords.join(', ')}`);
  }
}

async function fullReport(gameId) {
  console.log('═══════════════════════════════════');
  console.log('   itch.io Feedback Report');
  console.log('═══════════════════════════════════');
  
  await fetchRatings(gameId);
  await fetchComments(gameId, 10);
  await sentimentReport(gameId);
  
  console.log('\n═══════════════════════════════════');
  console.log('View full analytics at: https://itch.io/game/analytics/' + gameId);
}

async function main() {
  const [gameId, command] = process.argv.slice(2);
  
  if (!API_KEY) {
    console.error('Set ITCH_IO_API_KEY environment variable');
    process.exit(1);
  }
  
  if (!gameId) {
    console.log('Usage: node feedback.js <game-id> [command]');
    console.log('');
    console.log('Commands:');
    console.log('  comments    Fetch recent comments');
    console.log('  ratings     Show rating stats');
    console.log('  sentiment   Analyze comment sentiment');
    console.log('  report      Full feedback report (default)');
    console.log('');
    console.log('Example:');
    console.log('  node feedback.js 12345 report');
    process.exit(1);
  }
  
  const cmd = command || 'report';
  
  switch (cmd) {
    case 'comments':
      await fetchComments(gameId);
      break;
    case 'ratings':
      await fetchRatings(gameId);
      break;
    case 'sentiment':
      await sentimentReport(gameId);
      break;
    case 'report':
    default:
      await fullReport(gameId);
  }
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
