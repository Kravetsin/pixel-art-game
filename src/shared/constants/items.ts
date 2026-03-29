import { ItemId, ItemProperties } from '../types/inventory';

export const ITEM_PROPERTIES: Record<ItemId, ItemProperties> = {
  // Block drops
  [ItemId.DIRT]: {
    id: ItemId.DIRT, name: 'Dirt', maxStack: 99, color: 0x8b6914,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
  [ItemId.STONE]: {
    id: ItemId.STONE, name: 'Stone', maxStack: 99, color: 0x808080,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
  [ItemId.SAND]: {
    id: ItemId.SAND, name: 'Sand', maxStack: 99, color: 0xc2b280,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
  [ItemId.WOOD]: {
    id: ItemId.WOOD, name: 'Wood', maxStack: 99, color: 0x6b4226,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
  [ItemId.LEAVES]: {
    id: ItemId.LEAVES, name: 'Leaves', maxStack: 99, color: 0x2d5a1e,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
  [ItemId.COAL]: {
    id: ItemId.COAL, name: 'Coal', maxStack: 99, color: 0x333333,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: false,
  },
  [ItemId.IRON_ORE]: {
    id: ItemId.IRON_ORE, name: 'Iron Ore', maxStack: 99, color: 0xc8a882,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: false,
  },
  [ItemId.GOLD_ORE]: {
    id: ItemId.GOLD_ORE, name: 'Gold Ore', maxStack: 99, color: 0xffd700,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: false,
  },
  [ItemId.GRASS_BLOCK]: {
    id: ItemId.GRASS_BLOCK, name: 'Grass Block', maxStack: 99, color: 0x4a8c2a,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },

  // Wood tools
  [ItemId.WOOD_PICKAXE]: {
    id: ItemId.WOOD_PICKAXE, name: 'Wood Pickaxe', maxStack: 1, color: 0x8b6914,
    toolType: 'pickaxe', toolTier: 'wood', miningSpeed: 2, damage: 3, placeable: false,
  },
  [ItemId.WOOD_AXE]: {
    id: ItemId.WOOD_AXE, name: 'Wood Axe', maxStack: 1, color: 0x8b6914,
    toolType: 'axe', toolTier: 'wood', miningSpeed: 2, damage: 4, placeable: false,
  },
  [ItemId.WOOD_SWORD]: {
    id: ItemId.WOOD_SWORD, name: 'Wood Sword', maxStack: 1, color: 0x8b6914,
    toolType: 'sword', toolTier: 'wood', miningSpeed: 1, damage: 7, placeable: false,
  },

  // Stone tools
  [ItemId.STONE_PICKAXE]: {
    id: ItemId.STONE_PICKAXE, name: 'Stone Pickaxe', maxStack: 1, color: 0x808080,
    toolType: 'pickaxe', toolTier: 'stone', miningSpeed: 3, damage: 4, placeable: false,
  },
  [ItemId.STONE_AXE]: {
    id: ItemId.STONE_AXE, name: 'Stone Axe', maxStack: 1, color: 0x808080,
    toolType: 'axe', toolTier: 'stone', miningSpeed: 3, damage: 5, placeable: false,
  },
  [ItemId.STONE_SWORD]: {
    id: ItemId.STONE_SWORD, name: 'Stone Sword', maxStack: 1, color: 0x808080,
    toolType: 'sword', toolTier: 'stone', miningSpeed: 1, damage: 10, placeable: false,
  },

  // Iron tools
  [ItemId.IRON_PICKAXE]: {
    id: ItemId.IRON_PICKAXE, name: 'Iron Pickaxe', maxStack: 1, color: 0xcccccc,
    toolType: 'pickaxe', toolTier: 'iron', miningSpeed: 5, damage: 5, placeable: false,
  },
  [ItemId.IRON_AXE]: {
    id: ItemId.IRON_AXE, name: 'Iron Axe', maxStack: 1, color: 0xcccccc,
    toolType: 'axe', toolTier: 'iron', miningSpeed: 5, damage: 6, placeable: false,
  },
  [ItemId.IRON_SWORD]: {
    id: ItemId.IRON_SWORD, name: 'Iron Sword', maxStack: 1, color: 0xcccccc,
    toolType: 'sword', toolTier: 'iron', miningSpeed: 1, damage: 14, placeable: false,
  },

  // Craftables
  [ItemId.PLANKS]: {
    id: ItemId.PLANKS, name: 'Planks', maxStack: 99, color: 0xa0784c,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
  [ItemId.TORCH]: {
    id: ItemId.TORCH, name: 'Torch', maxStack: 99, color: 0xff8800,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
  [ItemId.WORKBENCH]: {
    id: ItemId.WORKBENCH, name: 'Workbench', maxStack: 1, color: 0x9a6b3c,
    toolType: 'none', toolTier: 'none', miningSpeed: 1, damage: 0, placeable: true,
  },
};
