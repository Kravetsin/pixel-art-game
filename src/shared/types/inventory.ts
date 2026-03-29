export enum ItemId {
  // Block drops
  DIRT = 'dirt',
  STONE = 'stone',
  SAND = 'sand',
  WOOD = 'wood',
  LEAVES = 'leaves',
  COAL = 'coal',
  IRON_ORE = 'iron_ore',
  GOLD_ORE = 'gold_ore',
  GRASS_BLOCK = 'grass_block',

  // Tools
  WOOD_PICKAXE = 'wood_pickaxe',
  WOOD_AXE = 'wood_axe',
  WOOD_SWORD = 'wood_sword',
  STONE_PICKAXE = 'stone_pickaxe',
  STONE_AXE = 'stone_axe',
  STONE_SWORD = 'stone_sword',
  IRON_PICKAXE = 'iron_pickaxe',
  IRON_AXE = 'iron_axe',
  IRON_SWORD = 'iron_sword',

  // Placeable
  PLANKS = 'planks',
  TORCH = 'torch',
  WORKBENCH = 'workbench',
}

export type ToolType = 'pickaxe' | 'axe' | 'sword' | 'none';
export type ToolTier = 'wood' | 'stone' | 'iron' | 'none';

export interface ItemProperties {
  id: ItemId;
  name: string;
  maxStack: number;
  color: number; // placeholder color for rendering
  toolType: ToolType;
  toolTier: ToolTier;
  miningSpeed: number; // multiplier (1 = hand speed)
  damage: number; // combat damage
  placeable: boolean;
}

export interface InventorySlot {
  itemId: ItemId | null;
  quantity: number;
}

export const INVENTORY_SIZE = 40;
export const HOTBAR_SIZE = 10;

export interface Inventory {
  slots: InventorySlot[];
  selectedSlot: number; // 0-9 for hotbar
}
