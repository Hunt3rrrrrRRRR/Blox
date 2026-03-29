# Blox Universe (Home + AI Games + Player Studio)

A Roblox-like browser platform built with **HTML, CSS, and JavaScript** using **Babylon.js** for 3D rendering, with a **Studio workflow** for player-made games and a **Java backend contract snippet** for multiplayer integration.

## What is included

- **Home Page**
  - AI-generated games list
  - Player-made games list
  - One-click play launch
- **Studio Page**
  - Create player game configs (name, theme, size, block, AI enemies)
  - Save to browser storage (`localStorage`)
  - Export snippet showing Java + JavaScript API contract
- **Play Page**
  - First-person movement and jump
  - Voxel terrain generated from selected game config
  - Block place/remove interactions
  - HUD + crosshair controls

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

## Controls in Play Mode

- **W / A / S / D**: Move
- **Mouse**: Look around
- **Space**: Jump
- **Left Click**: Remove block
- **Right Click**: Place block
- **1 / 2 / 3**: Switch block type
