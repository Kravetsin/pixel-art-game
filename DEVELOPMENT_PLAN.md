# 2D Pixel Art Survival Game - Development Plan

## Context
Building a 2D side-view pixel art survival game (Terraria-like) with resource gathering, building, combat, loot, and future co-op multiplayer. The repo is fresh (Node.js .gitignore only).

---

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Language | **TypeScript 5.x** | Type safety, shared types client/server |
| Bundler | **Vite 5** | Instant HMR, native TS, fast builds |
| Game Engine | **Phaser 3** | Built-in tilemaps, Arcade physics, camera, animations, sprites — all needed for a tile-based side-scroller |
| Map Editor | **Tiled** | Industry standard, exports JSON that Phaser consumes natively |
| Noise | **simplex-noise** | Procedural terrain generation |
| Persistence | **idb-keyval** | IndexedDB wrapper for save/load |
| Future Server | **Colyseus** | Authoritative state sync, rooms, reconnection for co-op |
| Testing | **Vitest** | Fast, Vite-native |
| Linting | **ESLint + Prettier** | Code quality |

**Why Phaser 3 over alternatives:**
- PixiJS is renderer-only — would require building tilemap, physics, camera, scene management from scratch
- Kaplay's ASCII level system doesn't scale to large procedural worlds
- Phaser has native Tiled JSON import, Arcade physics for platformer gravity/collisions, and first-class TypeScript support

---

## Architecture — Simulation/Rendering Separation

The critical design: **`src/shared/simulation/`** contains pure TypeScript game logic with ZERO Phaser imports. Phaser scenes read from these managers and render results. This makes future multiplayer migration tractable — move simulation to server, keep rendering on client.

**Player actions** use a command pattern: `{ type: 'MINE', x: 10, y: 5 }`. In single-player, commands feed local simulation. In multiplayer, they go to the server. This is the abstraction that makes the transition clean.

---

## Project Structure

```
pixel-art-game/
├── public/assets/          # sprites/, tiles/, audio/, ui/
├── src/
│   ├── main.ts             # Entry: creates Phaser game
│   ├── config.ts           # Game config, constants
│   ├── scenes/             # Phaser Scenes (view layer)
│   │   ├── BootScene.ts    # Asset preloading
│   │   ├── MenuScene.ts    # Main menu
│   │   ├── GameScene.ts    # Primary gameplay
│   │   ├── UIScene.ts      # HUD (health, hotbar)
│   │   └── InventoryScene.ts
│   ├── shared/             # SHARED client+server (NO Phaser imports)
│   │   ├── types/          # Entity, world, inventory, combat types
│   │   ├── constants/      # Tiles, items, recipes, biomes, monsters
│   │   └── simulation/     # WorldGenerator, WorldManager, InventoryManager,
│   │                       # CraftingManager, CombatResolver, EntityManager,
│   │                       # BuildingManager
│   ├── entities/           # Client-side Phaser sprite wrappers
│   ├── systems/            # Input, Camera, Particle, Lighting, Audio
│   ├── ui/                 # Hotbar, HealthBar, InventoryGrid, CraftingPanel
│   └── net/                # NetworkManager, StateSync (Phase 4)
├── server/                 # Colyseus server (Phase 4)
└── tests/
```

---

## Development Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal:** Character walking/jumping in a procedurally generated tile world.

- Project scaffolding: Vite + TypeScript + ESLint + Prettier
- `BootScene` with placeholder tileset (16x16 colored tiles)
- `WorldGenerator`: Simplex noise terrain — surface, dirt, stone layers
- `WorldManager`: chunk loading/unloading (64x64 tile chunks)
- `GameScene`: render tile world via Phaser tilemap layers
- Player entity: walk, jump, idle (placeholder spritesheet)
- `InputSystem`: WASD + Space
- `CameraSystem`: smooth follow
- Arcade physics: gravity, tile collision

**Milestone:** Walk and jump across infinite procedural terrain.

### Phase 2: Resource Gathering + Inventory (Weeks 4-6)
**Goal:** Mine tiles, chop trees, collect drops, manage inventory.

- Tile properties: hardness, required tool, drop item
- Mining mechanic: hold-click, progress bar, tile breaks, item spawns
- `ItemDrop` entity: bobbing sprite, auto-collect on proximity
- `InventoryManager`: add/remove/swap/split operations
- `UIScene`: hotbar (10 slots) with selection highlight
- `InventoryScene`: 40-slot grid, drag-and-drop (open with E)
- Tool selection affects mining speed
- Save/load to IndexedDB

**Milestone:** Full gather-and-organize loop with persistence.

### Phase 3: Crafting + Building + Combat (Weeks 7-11)

**3a — Crafting (Weeks 7-8):**
- Recipe system: ingredients + result + optional station requirement
- Crafting UI: available recipes, grayed if missing materials
- Basic recipes: planks, workbench, pickaxe, sword, torches

**3b — Building (Weeks 8-9):**
- Right-click placement with support validation
- Background wall layer
- Door tiles (toggleable)

**3c — Combat (Weeks 9-11):**
- Melee attack: swing animation + hitbox
- 3 monster types: Slime (hop), Zombie (chase), Skeleton (ranged)
- Monster spawning rules (biome, depth, time-of-day)
- Health bars, death/respawn, item drop on death
- Loot tables, knockback, i-frames

**Milestone:** Complete single-player survival loop.

### Phase 4: Polish + Multiplayer (Weeks 12-16)

**4a — Polish (12-13):** Real pixel art, particles, SFX, day/night cycle, minimap, more biomes/monsters/recipes.

**4b — Multiplayer (14-16):** Colyseus server, authoritative simulation, state sync, client-side prediction, 2-player co-op.

**Milestone:** Two players can co-op mine, build, and fight together.

### Phase 5: Content + Launch (Weeks 17-20)
Boss fights, 5+ biomes, 50+ recipes, armor system, storage chests, underground structures, performance optimization, deployment.

---

## Technical Decisions

- **Tile size:** 16x16px, rendered at 2-3x scale
- **Chunk size:** 64x64 tiles
- **Physics:** Phaser Arcade (client), simple AABB (shared simulation)
- **Entity IDs:** UUID strings (maps to Colyseus MapSchema keys)
- **Persistence:** IndexedDB (single-player), server disk (multiplayer)

---

## Verification

After Phase 1 implementation:
1. `npm run dev` — Vite dev server starts, game loads in browser
2. Player character renders and responds to WASD + Space
3. Procedural terrain generates differently with different seeds
4. Camera follows player smoothly
5. Walking far enough triggers chunk loading (no visual gaps)
6. `npm run test` — WorldGenerator and WorldManager unit tests pass
