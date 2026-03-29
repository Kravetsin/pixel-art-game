import { TileId, TileProperties } from '../types/world';

export const TILE_PROPERTIES: Record<TileId, TileProperties> = {
  [TileId.AIR]: {
    id: TileId.AIR,
    name: 'Air',
    hardness: 0,
    solid: false,
    color: 0x000000, // transparent
  },
  [TileId.GRASS]: {
    id: TileId.GRASS,
    name: 'Grass',
    hardness: 3,
    solid: true,
    color: 0x4a8c2a,
  },
  [TileId.DIRT]: {
    id: TileId.DIRT,
    name: 'Dirt',
    hardness: 3,
    solid: true,
    color: 0x8b6914,
  },
  [TileId.STONE]: {
    id: TileId.STONE,
    name: 'Stone',
    hardness: 6,
    solid: true,
    color: 0x808080,
  },
  [TileId.COAL_ORE]: {
    id: TileId.COAL_ORE,
    name: 'Coal Ore',
    hardness: 6,
    solid: true,
    color: 0x333333,
  },
  [TileId.IRON_ORE]: {
    id: TileId.IRON_ORE,
    name: 'Iron Ore',
    hardness: 8,
    solid: true,
    color: 0xc8a882,
  },
  [TileId.GOLD_ORE]: {
    id: TileId.GOLD_ORE,
    name: 'Gold Ore',
    hardness: 10,
    solid: true,
    color: 0xffd700,
  },
  [TileId.WOOD]: {
    id: TileId.WOOD,
    name: 'Wood',
    hardness: 4,
    solid: true,
    color: 0x6b4226,
  },
  [TileId.LEAVES]: {
    id: TileId.LEAVES,
    name: 'Leaves',
    hardness: 1,
    solid: false,
    color: 0x2d5a1e,
  },
  [TileId.BEDROCK]: {
    id: TileId.BEDROCK,
    name: 'Bedrock',
    hardness: 0, // unbreakable
    solid: true,
    color: 0x1a1a1a,
  },
  [TileId.SAND]: {
    id: TileId.SAND,
    name: 'Sand',
    hardness: 2,
    solid: true,
    color: 0xc2b280,
  },
};
