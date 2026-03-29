import { TileId } from '../types/world';
import { ItemId } from '../types/inventory';

export interface TileDrop {
  itemId: ItemId;
  quantity: number;
  requiredTool?: 'pickaxe' | 'axe';
}

export const TILE_DROPS: Partial<Record<TileId, TileDrop>> = {
  [TileId.GRASS]: { itemId: ItemId.DIRT, quantity: 1 },
  [TileId.DIRT]: { itemId: ItemId.DIRT, quantity: 1 },
  [TileId.STONE]: { itemId: ItemId.STONE, quantity: 1, requiredTool: 'pickaxe' },
  [TileId.COAL_ORE]: { itemId: ItemId.COAL, quantity: 1, requiredTool: 'pickaxe' },
  [TileId.IRON_ORE]: { itemId: ItemId.IRON_ORE, quantity: 1, requiredTool: 'pickaxe' },
  [TileId.GOLD_ORE]: { itemId: ItemId.GOLD_ORE, quantity: 1, requiredTool: 'pickaxe' },
  [TileId.WOOD]: { itemId: ItemId.WOOD, quantity: 1 },
  [TileId.LEAVES]: { itemId: ItemId.LEAVES, quantity: 1 },
  [TileId.SAND]: { itemId: ItemId.SAND, quantity: 1 },
};

/** Mining speed multiplier based on tool vs tile */
export function getMiningSpeedMultiplier(
  tileId: TileId,
  toolType: string,
): number {
  const drop = TILE_DROPS[tileId];
  if (!drop?.requiredTool) return 1;
  // Correct tool speeds up mining
  if (drop.requiredTool === toolType) return 1;
  // Wrong tool or no tool: very slow on stone/ore
  return 0.3;
}
