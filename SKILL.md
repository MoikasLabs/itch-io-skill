---
name: itch-io
description: Create, package, and publish games on itch.io marketplace. Use when building HTML5, desktop, or mobile games for indie distribution. Supports Godot, Ren'Py, PICO-8, custom HTML5. Covers butler CLI uploads, API integration, Steam key distribution, cartridge publishing, pricing, and release workflows. Triggers on itch.io, Godot, Ren'Py, PICO-8, indie game publishing, butler CLI, Steam keys, or visual novel deployment.
---

# itch.io Game Publishing

Publish indie games on itch.io — the open marketplace for independent creators.

## Quick Start

### 1. Install Butler (Upload Tool)

Butler is itch.io's command-line uploader:

```bash
# macOS
brew install itchio/brew/butler

# Windows (via scoop)
scoop install butler

# Linux
wget -O butler.zip https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default
unzip butler.zip
chmod +x butler
sudo mv butler /usr/local/bin/
butler -v  # verify
```

### 2. Login

```bash
butler login
# Opens browser for API key auth
```

### 3. Push Your Game

```bash
# HTML5 game
butler push ./dist USERNAME/GAME-NAME:html5

# Windows build
butler push ./build/windows USERNAME/GAME-NAME:windows

# Multi-platform
butler push ./build/mac USERNAME/GAME-NAME:osx
butler push ./build/linux USERNAME/GAME-NAME:linux
```

## Game Channels

itch.io uses channels to organize builds:

| Channel | Purpose |
|---------|---------|
| `html5` | Browser-playable games |
| `windows` | Windows executable |
| `osx` | macOS app |
| `linux` | Linux binary |
| `android` | Android APK |
| `webgl` | Unity WebGL builds |

Multiple channels can exist on one game page.

## API Access

### API Key Location
- User Settings → API Keys → Generate
- Store in `ITCH_IO_API_KEY` environment variable

### Common API Endpoints

```bash
# My games
curl -s -H "Authorization: $ITCH_IO_API_KEY" \
  https://api.itch.io/games

# Game details
curl -s -H "Authorization: $ITCH_IO_API_KEY" \
  https://api.itch.io/games/GAME_ID

# Uploads for a game
curl -s -H "Authorization: $ITCH_IO_API_KEY" \
  https://api.itch.io/games/GAME_ID/uploads
```

### JavaScript SDK

```javascript
// Using itch.io API for game data
const API_KEY = process.env.ITCH_IO_API_KEY;

async function getMyGames() {
  const res = await fetch('https://api.itch.io/games', {
    headers: { 'Authorization': API_KEY }
  });
  return await res.json();
}
```

## Game Page Setup

### Required Fields
- Title (max 60 chars)
- Classification (Game, Tool, etc.)
- Kind (HTML5, Downloadable, etc.)
- Genre (Action, Puzzle, etc.)

### Recommended
cover image (630×500)
screenshots (up to 15)
tags (comma-separated)
description (Markdown supported)

## Publishing Workflow

```bash
# 1. Build your game
npm run build  # or your build command

# 2. Create itch.io project (via web or API)
# Go to https://itch.io/game/new

# 3. Push builds
butler push ./dist USERNAME/GAME-NAME:html5

# 4. Check status
butler status USERNAME/GAME-NAME

# 5. Set visible when ready
# Via web dashboard under "Visibility"
```

## HTML5 Best Practices

### Build Structure
```
dist/
├── index.html      # Entry point
├── *.js            # Game scripts
├── *.css           # Styles
└── assets/         # Images, audio, etc.
```

### Template index.html
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Game</title>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script src="game.js"></script>
</body>
</html>
```

### itch.io Embedding
- Games automatically embed on itch.io pages
- Set viewport dimensions in game settings
- Handle resize events for responsive canvas

## Pricing Models

| Model | Setup |
|-------|-------|
| Free | Set price to $0 |
| Paid | Set minimum price |
| PWYW | Pay What You Want (suggested price) |
| Donations | Enable via project settings |

Configure at: Game → Edit → Payments & Donations

## Advanced Butler Commands

```bash
# Check build status
butler status USERNAME/GAME-NAME

# View detailed info
butler status USERNAME/GAME-NAME --verbose

# Push with specific version
butler push ./dist USERNAME/GAME-NAME:html5 --userversion 1.2.3

# Whitelist file patterns (include only)
butler push ./dist USERNAME/GAME-NAME:html5 \
  --if-glob "*.js" --if-glob "*.html" --if-glob "assets/**"

# Exclude patterns
butler push ./dist USERNAME/GAME-NAME:html5 \
  --ignore "*.map" --ignore "node_modules/**"

# Diff dry-run (see what would upload)
butler push ./dist USERNAME/GAME-NAME:html5 --dry-run
```

## Download Keys & Rewards

Generate download keys for backers/reviewers:

```bash
# Via API
curl -s -X POST \
  -H "Authorization: $ITCH_IO_API_KEY" \
  -d "game_id=GAME_ID&count=100" \
  https://api.itch.io/games/GAME_ID/download_keys

# Claim status
curl -s -H "Authorization: $ITCH_IO_API_KEY" \
  https://api.itch.io/games/GAME_ID/download_keys
```

## Webhooks

Configure post-release hooks at: Game → Edit → Webhooks

Events: `upload.created`, `upload.updated`

## Analytics

View at: Game → Analytics

- Downloads by platform
- Page views
- Revenue (if paid)
- Referral sources

## Common Issues

**Upload fails**: Check file size (<1GB recommended, <4GB max)  
**HTML5 blank**: Verify `index.html` at root, check console errors  
**Build not appearing**: Wait 30s after push, refresh dashboard  
**API 401**: Regenerate API key, check `Authorization` header format  

## Steam Key Integration

itch.io can distribute Steam keys to your paid users automatically:

### Setup
1. Game → Edit → Steam Keys
2. Connect your Steam account
3. Upload bulk keys (CSV format: `key,notes`)
4. Set distribution rules

### Key Distribution Modes
| Mode | Behavior |
|------|----------|
| **Auto-claim** | User gets key immediately after purchase |
| **Manual claim** | User clicks to reveal key (prevents bots) |
| **Review only** | Keys only for press/creator tier |

### CSV Upload Format
```csv
AAAAA-BBBBB-CCCCC,Region US
DDDDD-EEEEE-FFFFF,Press copy
GGGGG-HHHHH-IIIII,EU region
```

### API Key Management
```bash
# Get current Steam key count
curl -s -H "Authorization: $ITCH_IO_API_KEY" \
  https://api.itch.io/games/GAME_ID/steam_keys

# Upload new keys (CSV file)
curl -s -X POST \
  -H "Authorization: $ITCH_IO_API_KEY" \
  -F "keys=@steam_keys.csv" \
  https://api.itch.io/games/GAME_ID/steam_keys
```

Use `scripts/steam-keys.js` to bulk-upload and audit key inventory.

## PICO-8 Cartridge Publishing

PICO-8 is a fantasy console (128×128 display, 16 colors, Lua code). Carts can be published as embedded PNG cartridges on itch.io.

### Export Options

| Format | Use Case |
|--------|----------|
| `.p8.png` | Cartridge image (opens in PICO-8) |
| `.p8` | Source file (editable) |
| `index.html` | Web player (HTML5 export) |
| Standalone | Windows/Mac/Linux executables |

### HTML5 Export for itch.io
```bash
# In PICO-8 console
SAVE MYGAME.P8.PNG
EXPORT INDEX.HTML    # Creates html/ folder
```

Upload to itch.io:
```bash
butler push ./html USERNAME/GAME-NAME:html5
```

### PICO-8 Web Player Integration

For the smoothest itch.io embed, use the official web player template:

```html
<!-- Generated by PICO-8's EXPORT INDEX.HTML -->
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width">
  <style>
    canvas { image-rendering: pixelated; }
    #p8_container { width: 100%; max-width: 512px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="p8_container">
    <canvas id="canvas" width="128" height="128"></canvas>
  </div>
  <script src="index.js"></script>
</body>
</html>
```

### Cartridge Storage Tips
- 32KB limit per cart
- PNG contains full source — users can open and modify
- Label your carts clearly in the PNG image (128×128 visible area)

### Multi-cart Games
If your game exceeds 32KB, use multiple `.p8.png` files:
```
dist/
├── main.p8.png      # Launcher cart
├── level1.p8.png
├── level2.p8.png
└── index.html       # Custom launcher
```

Use `scripts/pico8-export.js` to batch-export carts and verify HTML5 builds.

## Godot Engine Publishing

Godot exports are straightforward — it outputs ready-to-upload folders for each platform.

### Export Setup
1. Project → Export → Add preset (Windows, Mac, Linux, Web)
2. Configure export templates (download from godotengine.org)
3. Export to `dist/` folder

### Web Export (HTML5)
- Use `Export Type: Web`
- Enable `Thread Support` for better performance
- Add `coi-service-worker.js` for itch.io CORS compatibility

### itch.io Channels
```bash
# Export from Godot first, then:
butler push ./dist/windows USERNAME/GAME:windows
butler push ./dist/linux USERNAME/GAME:linux
butler push ./dist/macos USERNAME/GAME:osx
butler push ./dist/web USERNAME/GAME:html5
```

### Recommended Project Structure
```
my-godot-game/
├── project.godot
├── assets/
├── src/
└── build/          # Godot export output
    ├── windows/
    ├── linux/
    ├── macos/
    └── web/index.html
```

### CORS Fix for itch.io Web Export
If your Godot HTML5 build fails to load on itch.io due to SharedArrayBuffer:

1. Download `coi-serviceworker.js` from https://github.com/gzuidhof/coi-serviceworker
2. Include in your `web/` export folder
3. Add to `<head>` in `index.html`:
```html
<script src="coi-serviceworker.js"></script>
```

Use `scripts/godot-export.js` to verify exports and batch-upload all channels.

## Ren'Py Visual Novel Publishing

Ren'Py builds self-contained distributions perfect for itch.io.

### Build Steps
1. Launcher → Build Distributions
2. Select platforms: Windows, macOS, Linux, or Web (HTML5)
3. Output goes to `renpy-project/build/`

### Web (HTML5) Export
- New in Ren'Py 8+ — uses Pyodide (WASM Python in browser)
- File size is larger (~20MB base) but no install needed
- Progress bar during load recommended

### Upload to itch.io
```bash
# Ren'Py builds are ready-to-run folders
butler push ./build/my-game-1.0-pc USERNAME/GAME:windows
butler push ./build/my-game-1.0-mac USERNAME/GAME:osx
butler push ./build/my-game-1.0-linux USERNAME/GAME:linux
butler push ./build/my-game-1.0-web USERNAME/GAME:html5
```

### Save Data Location
itch.io sandbox uses IndexedDB for browser saves. Desktop builds use standard OS locations.

### Recommended Settings
In `options.rpy`:
```renpy
define config.save_directory = "mygame-saves"  
define config.window_title = "My Game"
define gui.about = _p("""
    Written with Ren'Py. Published on itch.io.
""")
```

Use `scripts/renpy-publish.js` to check builds and generate butler commands.

## Feedback & Community

Collect player feedback, ratings, and reviews from your itch.io game pages.

### Fetching Comments

```bash
node feedback.js 12345 comments
```

Output:
```
💬 Recent Comments (10):

@player1 · 2/10/26 😊 Positive
   "Love the art style! Controls feel great too."

@player2 · 2/9/26 😞 Negative
   "Found a bug on level 3, game crashes when..."
```

### Rating Overview

```bash
node feedback.js 12345 ratings
```

Shows:
- Average rating (0-5 stars)
- Total number of ratings
- Views, downloads, purchases

### Sentiment Analysis

Basic keyword-based sentiment detection on comments:

```bash
node feedback.js 12345 sentiment
```

Output:
```
📊 Sentiment Analysis (47 comments):

   😊 Positive: 32 (68%)
   😐 Neutral:  10 (21%)
   😞 Negative: 5 (11%)

🔍 Common keywords: bug, good, graphics, level, love
```

### Full Feedback Report

```bash
node feedback.js 12345 report
```

Generates comprehensive report with ratings, comments, sentiment breakdown, and action items based on common keywords (bugs, crashes, etc.).

### Web Dashboard

For complete analytics:
- **Game Analytics:** https://itch.io/game/analytics/GAME_ID
- **Community:** Comments appear on game page
- **Devlog:** Post updates to engage players

Use `scripts/feedback.js` for automated feedback collection and weekly summaries.

## Resources

- Butler docs: https://itch.io/docs/butler/
- Creator guide: https://itch.io/docs/creators/getting-started
- API reference: https://itch.io/docs/api
- Community: https://itch.io/community
- PICO-8 manual: https://www.lexaloffle.com/pico-8.php?page=manual
- Steam key blog: https://itch.io/blog/21517/introducing-steam-key-management
- Godot exports: https://docs.godotengine.org/en/stable/tutorials/export/index.html
- Ren'Py building: https://www.renpy.org/doc/html/build.html

Use scripts/itch-publish.js for automated publishing pipelines.