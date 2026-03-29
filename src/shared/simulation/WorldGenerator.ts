import { createNoise2D } from 'simplex-noise';
import { TileId, Tile, Chunk } from '../types/world';
import { CHUNK_SIZE, WORLD_HEIGHT, SURFACE_LEVEL } from '../../config';

// Seeded PRNG (mulberry32)
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class WorldGenerator {
  private terrainNoise: (x: number, y: number) => number;
  private caveNoise: (x: number, y: number) => number;
  private oreNoise: (x: number, y: number) => number;
  private treeRng: (x: number) => number;
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
    const rng1 = mulberry32(seed);
    const rng2 = mulberry32(seed + 1);
    const rng3 = mulberry32(seed + 2);

    this.terrainNoise = createNoise2D(rng1);
    this.caveNoise = createNoise2D(rng2);
    this.oreNoise = createNoise2D(rng3);

    const treeRngBase = mulberry32(seed + 3);
    // Pre-seeded per-column tree decision
    this.treeRng = (x: number) => {
      const r = mulberry32(this.seed * 31 + x * 17);
      return r();
    };
  }

  generateChunk(chunkX: number, chunkY: number): Chunk {
    const tiles: Tile[][] = [];

    for (let localY = 0; localY < CHUNK_SIZE; localY++) {
      const row: Tile[] = [];
      for (let localX = 0; localX < CHUNK_SIZE; localX++) {
        const worldX = chunkX * CHUNK_SIZE + localX;
        const worldY = chunkY * CHUNK_SIZE + localY;
        const tileId = this.getTileAt(worldX, worldY);
        row.push({ id: tileId, damage: 0 });
      }
      tiles.push(row);
    }

    return { x: chunkX, y: chunkY, tiles, dirty: false };
  }

  private getSurfaceHeight(worldX: number): number {
    // Multi-octave noise for terrain shape
    const n1 = this.terrainNoise(worldX * 0.01, 0) * 20;
    const n2 = this.terrainNoise(worldX * 0.04, 0.5) * 8;
    const n3 = this.terrainNoise(worldX * 0.1, 1.0) * 3;
    return Math.floor(SURFACE_LEVEL + n1 + n2 + n3);
  }

  private getTileAt(worldX: number, worldY: number): TileId {
    // Above world = air
    if (worldY < 0) return TileId.AIR;

    // Bedrock at bottom
    if (worldY >= WORLD_HEIGHT - 1) return TileId.BEDROCK;

    const surfaceY = this.getSurfaceHeight(worldX);

    // Sky
    if (worldY < surfaceY - 1) {
      // Check for tree at this position
      return this.getTreeTile(worldX, worldY, surfaceY);
    }

    // Surface layer
    if (worldY === surfaceY) return TileId.GRASS;

    // Dirt layer (3-5 blocks below surface)
    const dirtDepth = 3 + Math.abs(Math.floor(this.terrainNoise(worldX * 0.1, 5) * 2));
    if (worldY <= surfaceY + dirtDepth) return TileId.DIRT;

    // Stone with caves and ores
    const depth = worldY - surfaceY;

    // Cave carving
    const caveVal = this.caveNoise(worldX * 0.05, worldY * 0.05);
    if (caveVal > 0.55 && worldY < WORLD_HEIGHT - 5) return TileId.AIR;

    // Ore generation
    return this.getOreOrStone(worldX, worldY, depth);
  }

  private getOreOrStone(worldX: number, worldY: number, depth: number): TileId {
    const oreVal = this.oreNoise(worldX * 0.15, worldY * 0.15);

    // Coal: common, starts shallow
    if (depth > 5 && oreVal > 0.65) return TileId.COAL_ORE;

    // Iron: medium depth
    if (depth > 20 && oreVal < -0.7) return TileId.IRON_ORE;

    // Gold: deep, rare
    if (depth > 50 && oreVal > 0.8) return TileId.GOLD_ORE;

    return TileId.STONE;
  }

  private getTreeTile(worldX: number, worldY: number, surfaceY: number): TileId {
    // Trees grow above the surface
    const treeChance = this.treeRng(worldX);
    if (treeChance > 0.12) return TileId.AIR; // ~12% of columns have trees

    // Only generate trees at spaced intervals (no adjacent trees)
    if (this.treeRng(worldX - 1) <= 0.12 || this.treeRng(worldX + 1) <= 0.06) {
      return TileId.AIR;
    }

    const trunkHeight = 4 + Math.floor(treeChance * 25) % 3; // 4-6 blocks tall
    const trunkTop = surfaceY - trunkHeight;

    // Trunk
    if (worldX === worldX && worldY >= trunkTop && worldY < surfaceY) {
      return TileId.WOOD;
    }

    // Leaves (crown around trunk top)
    const leafRadius = 2;
    const leafCenterY = trunkTop - 1;
    const dx = 0; // tree is single column for trunk
    const dy = worldY - leafCenterY;

    if (worldY >= leafCenterY - leafRadius && worldY <= leafCenterY + 1) {
      // Leaf area around top of trunk
      if (Math.abs(dy) <= leafRadius) {
        return TileId.LEAVES;
      }
    }

    return TileId.AIR;
  }
}
