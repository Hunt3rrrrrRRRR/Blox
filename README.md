# Blox (Home + AI Games + Player Studio)

A Roblox-like browser platform built with **HTML, CSS, and JavaScript** using **Babylon.js** for 3D rendering, with a **Studio workflow** for player-made games and a **Java backend contract snippet** for multiplayer integration.

## What is included

- **Home Page**
  - AI-generated games list
  - Player-made games list
  - One-click play launch
- **Studio Page**
  - Create player game configs (name, theme, size, block, AI enemies)
  - Personalization setup (avatar style, outfit theme, audio theme)
  - Growth fields (search tags + studio brand)
  - Save to browser storage (`localStorage`)
  - Export snippet showing Java + JavaScript API contract
- **Play Page**
  - First-person movement and jump
  - Voxel terrain generated from selected game config
  - Block place/remove interactions
  - HUD + crosshair controls
  - Player profile panel and mobile-friendly touch controls
  - Session progress persistence (sessions played, blocks placed, blocks removed)

## Tech stack

- **HTML**: app structure (home/studio/play views)
- **CSS**: UI panels, cards, layout, HUD, and game canvas styles
- **JavaScript**: routing, studio logic, persistence, AI game generation, Babylon.js runtime
- **Java (integration target)**: included API contract snippet for a Spring Boot style endpoint

## Run locally

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080>

## How to play

1. Open the **Home** page.
2. Choose any AI or player-made game and click **Play**.
3. In Play mode, click/tap once to focus controls.
4. Build or destroy blocks, explore the world, and your progress is saved automatically.

### Desktop controls

- **W / A / S / D**: Move
- **Mouse**: Look around
- **Space**: Jump
- **Left Click**: Remove block
- **Right Click**: Place block
- **1 / 2 / 3**: Switch block type

### Mobile controls

- Use the on-screen movement buttons (**↑ ← → ↓**)
- Use **Jump**, **Place**, and **Remove** buttons in the Play view

## Browser compatibility

- Works on modern versions of **Chrome, Edge, Firefox, and Safari** with WebGL enabled.
- Includes fallbacks for:
  - ID generation when `crypto.randomUUID()` is unavailable.
  - Pointer lock vendor-prefixed APIs.
  - Sky rendering when `BABYLON.SkyMaterial` is unavailable.
- If WebGL is not supported by the browser/device, Play mode shows a compatibility message instead of crashing.
