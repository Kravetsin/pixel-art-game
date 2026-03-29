import { Chunk, Tile, TileId } from '../types/world';
import { CHUNK_SIZE, WORLD_HEIGHT } from '../../config';
import { WorldGenerator } from './WorldGenerator';

export class WorldManager {
  private chunks: Map<string, Chunk> = new Map();
  private generator: WorldGenerator;

  constructor(seed: number) {
    this.generator = new WorldGenerator(seed);
  }

  private chunkKey(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  getChunk(cx: number, cy: number): Chunk {
    const key = this.chunkKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = this.generator.generateChunk(cx, cy);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  /** Convert world tile coordinates to chunk coordinates */
  worldToChunk(worldX: number, worldY: number): { cx: number; cy: number; localX: number; localY: number } {
    const cx = Math.floor(worldX / CHUNK_SIZE);
    const cy = Math.floor(worldY / CHUNK_SIZE);
    const localX = ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localY = ((worldY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return { cx, cy, localX, localY };
  }

  getTile(worldX: number, worldY: number): Tile {
    if (worldY < 0 || worldY >= WORLD_HEIGHT) {
      return { id: TileId.AIR, damage: 0 };
    }
    const { cx, cy, localX, localY } = this.worldToChunk(worldX, worldY);
    const chunk = this.getChunk(cx, cy);
    return chunk.tiles[localY][localX];
  }

  setTile(worldX: number, worldY: number, tileId: TileId): void {
    if (worldY < 0 || worldY >= WORLD_HEIGHT) return;
    const { cx, cy, localX, localY } = this.worldToChunk(worldX, worldY);
    const chunk = this.getChunk(cx, cy);
    chunk.tiles[localY][localX] = { id: tileId, damage: 0 };
    chunk.dirty = true;
  }

  isSolid(worldX: number, worldY: number): boolean {
    const tile = this.getTile(worldX, worldY);
    return tile.id !== TileId.AIR && tile.id !== TileId.LEAVES;
  }

  /** Load chunks around a center point, unload distant ones */
  updateLoadedChunks(centerWorldX: number, centerWorldY: number, renderDistance: number): {
    loaded: Chunk[];
    unloaded: string[];
  } {
    const centerCX = Math.floor(centerWorldX / CHUNK_SIZE);
    const centerCY = Math.floor(centerWorldY / CHUNK_SIZE);

    const neededKeys = new Set<string>();
    const loaded: Chunk[] = [];

    for (let dx = -renderDistance; dx <= renderDistance; dx++) {
      for (let dy = -renderDistance; dy <= renderDistance; dy++) {
        const cx = centerCX + dx;
        const cy = centerCY + dy;
        const key = this.chunkKey(cx, cy);
        neededKeys.add(key);
        if (!this.chunks.has(key)) {
          loaded.push(this.getChunk(cx, cy));
        }
      }
    }

    const unloaded: string[] = [];
    for (const key of this.chunks.keys()) {
      if (!neededKeys.has(key)) {
        this.chunks.delete(key);
        unloaded.push(key);
      }
    }

    return { loaded, unloaded };
  }

  /** Get all currently loaded chunks */
  getLoadedChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /** Find spawn Y position: first air above surface at given X */
  findSpawnY(worldX: number): number {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (this.isSolid(worldX, y)) {
        return y - 1; // one tile above the solid ground
      }
    }
    return WORLD_HEIGHT / 2;
  }
}
