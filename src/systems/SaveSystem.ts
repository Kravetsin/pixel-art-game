import { get, set, del } from 'idb-keyval';
import { Inventory } from '../shared/types/inventory';
import { Chunk } from '../shared/types/world';

const SAVE_KEY_INVENTORY = 'save_inventory';
const SAVE_KEY_CHUNKS = 'save_chunks';
const SAVE_KEY_PLAYER = 'save_player';
const SAVE_KEY_SEED = 'save_seed';

export interface PlayerSaveData {
  x: number;
  y: number;
}

export interface SaveData {
  seed: number;
  inventory: Inventory;
  player: PlayerSaveData;
  chunks: Array<{ x: number; y: number; tiles: { id: number; damage: number }[][] }>;
}

export async function saveGame(
  seed: number,
  inventory: Inventory,
  playerX: number,
  playerY: number,
  chunks: Chunk[],
): Promise<void> {
  // Only save chunks that were modified
  const dirtyChunks = chunks
    .filter((c) => c.dirty)
    .map((c) => ({
      x: c.x,
      y: c.y,
      tiles: c.tiles.map((row) => row.map((t) => ({ id: t.id, damage: t.damage }))),
    }));

  await Promise.all([
    set(SAVE_KEY_SEED, seed),
    set(SAVE_KEY_INVENTORY, JSON.parse(JSON.stringify(inventory))),
    set(SAVE_KEY_PLAYER, { x: playerX, y: playerY }),
    // Merge with existing saved chunks
    mergeChunks(dirtyChunks),
  ]);
}

async function mergeChunks(
  newChunks: Array<{ x: number; y: number; tiles: { id: number; damage: number }[][] }>,
): Promise<void> {
  const existing = (await get(SAVE_KEY_CHUNKS)) as typeof newChunks | undefined;
  const map = new Map<string, (typeof newChunks)[0]>();

  if (existing) {
    for (const c of existing) {
      map.set(`${c.x},${c.y}`, c);
    }
  }
  for (const c of newChunks) {
    map.set(`${c.x},${c.y}`, c);
  }

  await set(SAVE_KEY_CHUNKS, Array.from(map.values()));
}

export async function loadGame(): Promise<SaveData | null> {
  const seed = await get(SAVE_KEY_SEED);
  if (seed === undefined) return null;

  const inventory = await get(SAVE_KEY_INVENTORY);
  const player = await get(SAVE_KEY_PLAYER);
  const chunks = (await get(SAVE_KEY_CHUNKS)) || [];

  return {
    seed: seed as number,
    inventory: inventory as Inventory,
    player: player as PlayerSaveData,
    chunks: chunks as SaveData['chunks'],
  };
}

export async function deleteSave(): Promise<void> {
  await Promise.all([
    del(SAVE_KEY_SEED),
    del(SAVE_KEY_INVENTORY),
    del(SAVE_KEY_PLAYER),
    del(SAVE_KEY_CHUNKS),
  ]);
}

export async function hasSave(): Promise<boolean> {
  const seed = await get(SAVE_KEY_SEED);
  return seed !== undefined;
}
