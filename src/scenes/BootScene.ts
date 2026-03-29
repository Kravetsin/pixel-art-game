import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import { TileId } from '../shared/types/world';
import { ItemId } from '../shared/types/inventory';

// ── helpers ──

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** Fill a rectangular region with a color */
function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Deterministic hash for seeded random patterns */
function hash(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

// ── tile drawing ──

function drawGrass(ctx: Ctx, ox: number, oy: number): void {
  // Dirt base
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 1);
      if (y < 3) {
        // Green grass top
        const g = v < 0.3 ? '#3a7a22' : v < 0.6 ? '#4a8c2a' : '#5a9a35';
        px(ctx, ox + x, oy + y, g);
      } else {
        // Dirt body
        const d = v < 0.3 ? '#7a5a10' : v < 0.7 ? '#8b6914' : '#9a7520';
        px(ctx, ox + x, oy + y, d);
      }
    }
  }
  // Grass blade highlights on top row
  for (let x = 0; x < 16; x += 2) {
    if (hash(x, 0, 5) > 0.4) {
      px(ctx, ox + x, oy, '#6ab840');
    }
  }
}

function drawDirt(ctx: Ctx, ox: number, oy: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 2);
      const c = v < 0.15 ? '#6a4a0a' : v < 0.4 ? '#7a5a10' : v < 0.75 ? '#8b6914' : '#9a7520';
      px(ctx, ox + x, oy + y, c);
    }
  }
  // Small pebbles
  px(ctx, ox + 3, oy + 7, '#aaa');
  px(ctx, ox + 11, oy + 12, '#999');
  px(ctx, ox + 7, oy + 4, '#aaa');
}

function drawStone(ctx: Ctx, ox: number, oy: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 3);
      const c = v < 0.2 ? '#6e6e6e' : v < 0.5 ? '#808080' : v < 0.8 ? '#8a8a8a' : '#959595';
      px(ctx, ox + x, oy + y, c);
    }
  }
  // Crack lines
  for (let i = 3; i < 8; i++) px(ctx, ox + i, oy + 5, '#5a5a5a');
  for (let i = 9; i < 13; i++) px(ctx, ox + i, oy + 11, '#5a5a5a');
  px(ctx, ox + 8, oy + 5, '#5a5a5a');
  px(ctx, ox + 8, oy + 6, '#5a5a5a');
}

function drawOre(ctx: Ctx, ox: number, oy: number, oreColor: string, oreHighlight: string): void {
  // Stone base
  drawStone(ctx, ox, oy);
  // Ore clusters
  const spots = [[3, 3], [4, 3], [3, 4], [10, 8], [11, 8], [11, 9], [10, 9], [6, 12], [7, 12], [7, 13]];
  for (const [x, y] of spots) {
    px(ctx, ox + x, oy + y, oreColor);
  }
  // Highlights
  px(ctx, ox + 3, oy + 3, oreHighlight);
  px(ctx, ox + 10, oy + 8, oreHighlight);
  px(ctx, ox + 6, oy + 12, oreHighlight);
}

function drawWood(ctx: Ctx, ox: number, oy: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 7);
      const base = v < 0.3 ? '#5a3618' : v < 0.7 ? '#6b4226' : '#7a4e30';
      px(ctx, ox + x, oy + y, base);
    }
  }
  // Vertical wood grain
  for (let y = 0; y < 16; y++) {
    px(ctx, ox + 4, oy + y, '#4d2f12');
    px(ctx, ox + 11, oy + y, '#4d2f12');
  }
  // Bark edges
  for (let y = 0; y < 16; y++) {
    px(ctx, ox, oy + y, '#4a2a10');
    px(ctx, ox + 15, oy + y, '#4a2a10');
  }
  // Knot
  px(ctx, ox + 7, oy + 6, '#4d2f12');
  px(ctx, ox + 8, oy + 6, '#4d2f12');
  px(ctx, ox + 7, oy + 7, '#4d2f12');
  px(ctx, ox + 8, oy + 7, '#4d2f12');
}

function drawLeaves(ctx: Ctx, ox: number, oy: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 8);
      if (v < 0.12) {
        // Gaps showing sky
        continue;
      }
      const c = v < 0.3 ? '#1e4a14' : v < 0.55 ? '#2d5a1e' : v < 0.8 ? '#3a6e28' : '#48802e';
      px(ctx, ox + x, oy + y, c);
    }
  }
}

function drawBedrock(ctx: Ctx, ox: number, oy: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 9);
      const c = v < 0.3 ? '#0e0e0e' : v < 0.6 ? '#1a1a1a' : v < 0.85 ? '#252525' : '#303030';
      px(ctx, ox + x, oy + y, c);
    }
  }
}

function drawSand(ctx: Ctx, ox: number, oy: number): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 10);
      const c = v < 0.2 ? '#b5a270' : v < 0.5 ? '#c2b280' : v < 0.8 ? '#cfc090' : '#d8ca98';
      px(ctx, ox + x, oy + y, c);
    }
  }
  // Shell/pebble details
  px(ctx, ox + 5, oy + 9, '#e0d8b0');
  px(ctx, ox + 12, oy + 4, '#a89868');
}

const TILE_DRAW: Record<number, (ctx: Ctx, ox: number, oy: number) => void> = {
  [TileId.GRASS]: drawGrass,
  [TileId.DIRT]: drawDirt,
  [TileId.STONE]: drawStone,
  [TileId.COAL_ORE]: (ctx, ox, oy) => drawOre(ctx, ox, oy, '#222222', '#333333'),
  [TileId.IRON_ORE]: (ctx, ox, oy) => drawOre(ctx, ox, oy, '#c8a882', '#e0c8a0'),
  [TileId.GOLD_ORE]: (ctx, ox, oy) => drawOre(ctx, ox, oy, '#daa520', '#ffd700'),
  [TileId.WOOD]: drawWood,
  [TileId.LEAVES]: drawLeaves,
  [TileId.BEDROCK]: drawBedrock,
  [TileId.SAND]: drawSand,
};

// ── player sprite drawing ──

function drawPlayerFrame(ctx: Ctx, ox: number, frame: number): void {
  // 16x32 character

  // ── Hair (brown) ──
  rect(ctx, ox + 4, 0, 8, 3, '#6b3a1f');
  rect(ctx, ox + 3, 1, 10, 2, '#6b3a1f');
  px(ctx, ox + 3, 3, '#6b3a1f'); // side hair
  px(ctx, ox + 12, 3, '#6b3a1f');

  // ── Head / face (skin) ──
  rect(ctx, ox + 4, 3, 8, 6, '#f0c090');
  rect(ctx, ox + 3, 4, 10, 4, '#f0c090');
  // Darker skin shading
  px(ctx, ox + 3, 7, '#d8a878');
  px(ctx, ox + 12, 7, '#d8a878');

  // ── Eyes ──
  rect(ctx, ox + 5, 5, 2, 2, '#ffffff');
  rect(ctx, ox + 9, 5, 2, 2, '#ffffff');
  px(ctx, ox + 6, 5, '#2244aa');
  px(ctx, ox + 6, 6, '#1a1a2e');
  px(ctx, ox + 10, 5, '#2244aa');
  px(ctx, ox + 10, 6, '#1a1a2e');

  // ── Mouth ──
  px(ctx, ox + 7, 7, '#c08060');
  px(ctx, ox + 8, 7, '#c08060');

  // ── Neck ──
  rect(ctx, ox + 6, 9, 4, 1, '#e0b080');

  // ── Shirt (blue/teal) ──
  rect(ctx, ox + 3, 10, 10, 8, '#3388bb');
  rect(ctx, ox + 4, 10, 8, 8, '#44aacc');
  // Shirt highlights
  rect(ctx, ox + 5, 11, 2, 1, '#55bbdd');
  rect(ctx, ox + 9, 11, 2, 1, '#55bbdd');
  // Collar
  rect(ctx, ox + 6, 10, 4, 1, '#55bbdd');
  // Shadow under arms
  px(ctx, ox + 3, 15, '#2a6688');
  px(ctx, ox + 12, 15, '#2a6688');
  // Belt
  rect(ctx, ox + 4, 17, 8, 1, '#5a3a1a');
  px(ctx, ox + 7, 17, '#c8a848'); // buckle
  px(ctx, ox + 8, 17, '#c8a848');

  // ── Arms ──
  const armSwing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  // Left arm
  rect(ctx, ox + 2, 10 + armSwing, 2, 7, '#3388bb');
  rect(ctx, ox + 2, 16 + armSwing, 2, 2, '#f0c090'); // hand
  // Right arm
  rect(ctx, ox + 12, 10 - armSwing, 2, 7, '#3388bb');
  rect(ctx, ox + 12, 16 - armSwing, 2, 2, '#f0c090'); // hand

  // ── Pants (brown) ──
  rect(ctx, ox + 4, 18, 8, 6, '#6b5030');
  rect(ctx, ox + 5, 18, 6, 6, '#7a5e3a');
  // Shading crease
  px(ctx, ox + 7, 19, '#5a4020');
  px(ctx, ox + 8, 20, '#5a4020');

  if (frame === 0) {
    // Idle — legs together
    rect(ctx, ox + 4, 24, 3, 5, '#6b5030');
    rect(ctx, ox + 9, 24, 3, 5, '#6b5030');
    // Boots
    rect(ctx, ox + 3, 28, 4, 4, '#3a2a18');
    rect(ctx, ox + 9, 28, 4, 4, '#3a2a18');
    // Boot soles
    rect(ctx, ox + 3, 31, 4, 1, '#2a1a0e');
    rect(ctx, ox + 9, 31, 4, 1, '#2a1a0e');
    // Boot highlights
    px(ctx, ox + 4, 28, '#4a3a28');
    px(ctx, ox + 10, 28, '#4a3a28');
  } else if (frame === 1) {
    // Walk 1 — left leg forward, right back
    rect(ctx, ox + 3, 24, 3, 5, '#6b5030');
    rect(ctx, ox + 10, 24, 3, 4, '#6b5030');
    rect(ctx, ox + 2, 28, 4, 4, '#3a2a18');
    rect(ctx, ox + 10, 27, 4, 4, '#3a2a18');
    rect(ctx, ox + 2, 31, 4, 1, '#2a1a0e');
    rect(ctx, ox + 10, 30, 4, 1, '#2a1a0e');
  } else if (frame === 2) {
    // Walk 2 — right leg forward, left back
    rect(ctx, ox + 4, 24, 3, 4, '#6b5030');
    rect(ctx, ox + 9, 24, 3, 5, '#6b5030');
    rect(ctx, ox + 4, 27, 4, 4, '#3a2a18');
    rect(ctx, ox + 9, 28, 4, 4, '#3a2a18');
    rect(ctx, ox + 4, 30, 4, 1, '#2a1a0e');
    rect(ctx, ox + 9, 31, 4, 1, '#2a1a0e');
  } else {
    // Jump — legs tucked
    rect(ctx, ox + 4, 24, 3, 4, '#6b5030');
    rect(ctx, ox + 9, 24, 3, 4, '#6b5030');
    rect(ctx, ox + 3, 27, 4, 3, '#3a2a18');
    rect(ctx, ox + 9, 27, 4, 3, '#3a2a18');
    rect(ctx, ox + 3, 29, 4, 1, '#2a1a0e');
    rect(ctx, ox + 9, 29, 4, 1, '#2a1a0e');
  }
}

// ── item icon drawing (16x16) ──

function drawItemBlock(ctx: Ctx, ox: number, oy: number, tileId: TileId): void {
  // Draw a small 3D-ish block icon
  const draw = TILE_DRAW[tileId];
  if (draw) {
    // Draw the tile face at a slight offset for a "block in inventory" look
    ctx.save();
    draw(ctx, ox, oy);
    // 3D edge — right side darker
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(ox + 14, oy + 2, 2, 14);
    // 3D edge — bottom darker
    ctx.fillRect(ox + 2, oy + 14, 14, 2);
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(ox, oy, 14, 2);
    ctx.restore();
  }
}

function drawPickaxe(ctx: Ctx, ox: number, oy: number, headColor: string, handleColor: string): void {
  // Handle (diagonal)
  for (let i = 0; i < 10; i++) {
    px(ctx, ox + 3 + i, oy + 13 - i, handleColor);
    if (i < 9) px(ctx, ox + 4 + i, oy + 13 - i, '#4a3018'); // handle shadow
  }
  // Head
  rect(ctx, ox + 8, oy + 2, 6, 2, headColor);
  rect(ctx, ox + 7, oy + 3, 2, 2, headColor);
  rect(ctx, ox + 14, oy + 1, 2, 2, headColor);
  // Head highlight
  px(ctx, ox + 9, oy + 2, '#ffffff');
}

function drawAxe(ctx: Ctx, ox: number, oy: number, headColor: string, handleColor: string): void {
  // Handle
  for (let i = 0; i < 10; i++) {
    px(ctx, ox + 3 + i, oy + 13 - i, handleColor);
    if (i < 9) px(ctx, ox + 4 + i, oy + 13 - i, '#4a3018');
  }
  // Axe head
  rect(ctx, ox + 10, oy + 2, 3, 5, headColor);
  rect(ctx, ox + 13, oy + 3, 2, 3, headColor);
  px(ctx, ox + 9, oy + 3, headColor);
  // Blade edge highlight
  px(ctx, ox + 14, oy + 3, '#ffffff');
  px(ctx, ox + 14, oy + 4, '#dddddd');
}

function drawSword(ctx: Ctx, ox: number, oy: number, bladeColor: string, guardColor: string): void {
  // Blade (diagonal)
  for (let i = 0; i < 9; i++) {
    px(ctx, ox + 5 + i, oy + 9 - i, bladeColor);
    px(ctx, ox + 6 + i, oy + 9 - i, bladeColor);
  }
  // Blade tip
  px(ctx, ox + 14, oy, '#ffffff');
  // Blade highlight
  for (let i = 0; i < 7; i++) {
    px(ctx, ox + 6 + i, oy + 8 - i, '#ffffff');
  }
  // Guard
  rect(ctx, ox + 3, oy + 9, 5, 2, guardColor);
  // Handle
  px(ctx, ox + 3, oy + 11, '#6b4226');
  px(ctx, ox + 2, oy + 12, '#6b4226');
  px(ctx, ox + 4, oy + 11, '#5a3618');
  px(ctx, ox + 3, oy + 12, '#5a3618');
  // Pommel
  px(ctx, ox + 1, oy + 13, guardColor);
  px(ctx, ox + 2, oy + 13, guardColor);
}

function drawTorch(ctx: Ctx, ox: number, oy: number): void {
  // Stick
  rect(ctx, ox + 7, oy + 6, 2, 9, '#6b4226');
  px(ctx, ox + 7, oy + 6, '#7a4e30');
  // Wrap
  px(ctx, ox + 6, oy + 7, '#8a6a40');
  px(ctx, ox + 9, oy + 7, '#8a6a40');
  // Flame
  rect(ctx, ox + 6, oy + 2, 4, 4, '#ff8800');
  rect(ctx, ox + 7, oy + 1, 2, 2, '#ffcc00');
  px(ctx, ox + 7, oy + 0, '#ffee66');
  px(ctx, ox + 8, oy + 1, '#ffee66');
  // Flame glow
  px(ctx, ox + 5, oy + 3, '#ff660044');
  px(ctx, ox + 10, oy + 3, '#ff660044');
}

function drawWorkbench(ctx: Ctx, ox: number, oy: number): void {
  // Table top
  rect(ctx, ox, oy + 2, 16, 4, '#9a7040');
  rect(ctx, ox + 1, oy + 2, 14, 1, '#b08850'); // highlight
  // Top surface detail
  px(ctx, ox + 4, oy + 3, '#7a5830');
  px(ctx, ox + 11, oy + 4, '#7a5830');
  // Legs
  rect(ctx, ox + 1, oy + 6, 3, 10, '#7a5830');
  rect(ctx, ox + 12, oy + 6, 3, 10, '#7a5830');
  // Cross beam
  rect(ctx, ox + 4, oy + 9, 8, 2, '#6a4820');
  // Saw detail on top
  px(ctx, ox + 7, oy + 2, '#aaaaaa');
  px(ctx, ox + 8, oy + 2, '#aaaaaa');
  px(ctx, ox + 9, oy + 3, '#aaaaaa');
}

function drawPlanks(ctx: Ctx, ox: number, oy: number): void {
  // Wood plank background
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = hash(x, y, 20);
      const c = v < 0.3 ? '#8a6438' : v < 0.7 ? '#a0784c' : '#b08858';
      px(ctx, ox + x, oy + y, c);
    }
  }
  // Horizontal plank lines
  for (let x = 0; x < 16; x++) {
    px(ctx, ox + x, oy + 5, '#70502a');
    px(ctx, ox + x, oy + 10, '#70502a');
  }
  // Nail details
  px(ctx, ox + 2, oy + 2, '#888888');
  px(ctx, ox + 13, oy + 7, '#888888');
  px(ctx, ox + 4, oy + 13, '#888888');
  // 3D edges
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(ox + 14, oy + 2, 2, 14);
  ctx.fillRect(ox + 2, oy + 14, 14, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(ox, oy, 14, 2);
}

function drawCoalItem(ctx: Ctx, ox: number, oy: number): void {
  // Coal lump shape
  rect(ctx, ox + 4, oy + 5, 8, 7, '#1a1a1a');
  rect(ctx, ox + 3, oy + 6, 10, 5, '#222222');
  rect(ctx, ox + 5, oy + 4, 6, 1, '#1e1e1e');
  // Shiny highlights
  px(ctx, ox + 5, oy + 6, '#444444');
  px(ctx, ox + 6, oy + 5, '#3a3a3a');
  px(ctx, ox + 9, oy + 8, '#383838');
}

function drawOreItem(ctx: Ctx, ox: number, oy: number, color: string, highlight: string): void {
  // Rock shape
  rect(ctx, ox + 3, oy + 5, 10, 7, '#707070');
  rect(ctx, ox + 4, oy + 4, 8, 1, '#686868');
  rect(ctx, ox + 4, oy + 12, 8, 1, '#606060');
  // Ore spots
  rect(ctx, ox + 5, oy + 6, 2, 2, color);
  rect(ctx, ox + 9, oy + 8, 2, 2, color);
  px(ctx, ox + 7, oy + 10, color);
  // Highlights
  px(ctx, ox + 5, oy + 6, highlight);
  px(ctx, ox + 9, oy + 8, highlight);
}

// ── mapping ──

const ITEM_ICON_DRAW: Partial<Record<ItemId, (ctx: Ctx, ox: number, oy: number) => void>> = {
  [ItemId.DIRT]: (c, x, y) => drawItemBlock(c, x, y, TileId.DIRT),
  [ItemId.STONE]: (c, x, y) => drawItemBlock(c, x, y, TileId.STONE),
  [ItemId.SAND]: (c, x, y) => drawItemBlock(c, x, y, TileId.SAND),
  [ItemId.WOOD]: (c, x, y) => drawItemBlock(c, x, y, TileId.WOOD),
  [ItemId.LEAVES]: (c, x, y) => drawItemBlock(c, x, y, TileId.LEAVES),
  [ItemId.GRASS_BLOCK]: (c, x, y) => drawItemBlock(c, x, y, TileId.GRASS),
  [ItemId.PLANKS]: drawPlanks,

  [ItemId.COAL]: drawCoalItem,
  [ItemId.IRON_ORE]: (c, x, y) => drawOreItem(c, x, y, '#c8a882', '#e0c8a0'),
  [ItemId.GOLD_ORE]: (c, x, y) => drawOreItem(c, x, y, '#daa520', '#ffd700'),

  [ItemId.WOOD_PICKAXE]: (c, x, y) => drawPickaxe(c, x, y, '#8b6914', '#6b4226'),
  [ItemId.STONE_PICKAXE]: (c, x, y) => drawPickaxe(c, x, y, '#808080', '#6b4226'),
  [ItemId.IRON_PICKAXE]: (c, x, y) => drawPickaxe(c, x, y, '#c0c0c0', '#6b4226'),
  [ItemId.WOOD_AXE]: (c, x, y) => drawAxe(c, x, y, '#8b6914', '#6b4226'),
  [ItemId.STONE_AXE]: (c, x, y) => drawAxe(c, x, y, '#808080', '#6b4226'),
  [ItemId.IRON_AXE]: (c, x, y) => drawAxe(c, x, y, '#c0c0c0', '#6b4226'),
  [ItemId.WOOD_SWORD]: (c, x, y) => drawSword(c, x, y, '#8b6914', '#6b4226'),
  [ItemId.STONE_SWORD]: (c, x, y) => drawSword(c, x, y, '#909090', '#6b4226'),
  [ItemId.IRON_SWORD]: (c, x, y) => drawSword(c, x, y, '#d0d0d0', '#c8a848'),

  [ItemId.TORCH]: drawTorch,
  [ItemId.WORKBENCH]: drawWorkbench,
};

// ══════════════════════════════════════
//  Boot Scene
// ══════════════════════════════════════

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.generateTileset();
    this.generatePlayer();
    this.generateItemIcons();
  }

  create(): void {
    this.scene.start('Game');
  }

  // ── tileset (one 16×16 cell per TileId) ──

  private generateTileset(): void {
    const tileIds = Object.values(TileId).filter((v) => typeof v === 'number') as TileId[];
    const canvas = document.createElement('canvas');
    canvas.width = tileIds.length * TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d')!;

    tileIds.forEach((tileId, index) => {
      if (tileId === TileId.AIR) return; // leave transparent
      const draw = TILE_DRAW[tileId];
      if (draw) {
        draw(ctx, index * TILE_SIZE, 0);
      }
    });

    this.textures.addCanvas('tileset', canvas);
  }

  // ── player spritesheet (4 frames, each 16×32) ──

  private generatePlayer(): void {
    const w = TILE_SIZE;
    const h = TILE_SIZE * 2;
    const canvas = document.createElement('canvas');
    canvas.width = w * 4;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    for (let frame = 0; frame < 4; frame++) {
      drawPlayerFrame(ctx, frame * w, frame);
    }

    this.textures.addCanvas('player', canvas);
  }

  // ── item icons (one 16×16 per ItemId, stored in a strip) ──

  private generateItemIcons(): void {
    const itemIds = Object.values(ItemId);
    const canvas = document.createElement('canvas');
    canvas.width = itemIds.length * TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d')!;

    itemIds.forEach((itemId, index) => {
      const draw = ITEM_ICON_DRAW[itemId];
      if (draw) {
        draw(ctx, index * TILE_SIZE, 0);
      }
    });

    // Store as canvas texture, add frames per item
    const tex = this.textures.addCanvas('items', canvas)!;
    itemIds.forEach((itemId, index) => {
      tex!.add(itemId, 0, index * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    });
  }
}
