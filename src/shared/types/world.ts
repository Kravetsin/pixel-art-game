export enum TileId {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COAL_ORE = 4,
  IRON_ORE = 5,
  GOLD_ORE = 6,
  WOOD = 7,
  LEAVES = 8,
  BEDROCK = 9,
  SAND = 10,
}

export interface TileProperties {
  id: TileId;
  name: string;
  hardness: number; // hits to break (0 = unbreakable)
  solid: boolean;
  color: number; // hex color for placeholder rendering
}

export interface Tile {
  id: TileId;
  damage: number; // accumulated mining damage
}

export interface Chunk {
  x: number; // chunk coordinate (not pixel)
  y: number;
  tiles: Tile[][];
  dirty: boolean;
}

export interface WorldSeed {
  seed: number;
}
