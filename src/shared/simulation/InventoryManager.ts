import { Inventory, InventorySlot, ItemId, INVENTORY_SIZE, HOTBAR_SIZE } from '../types/inventory';
import { ITEM_PROPERTIES } from '../constants/items';

export function createInventory(): Inventory {
  const slots: InventorySlot[] = [];
  for (let i = 0; i < INVENTORY_SIZE; i++) {
    slots.push({ itemId: null, quantity: 0 });
  }
  return { slots, selectedSlot: 0 };
}

/** Add items to inventory. Returns the quantity that didn't fit. */
export function addItem(inventory: Inventory, itemId: ItemId, quantity: number): number {
  const props = ITEM_PROPERTIES[itemId];
  let remaining = quantity;

  // First pass: fill existing stacks
  for (const slot of inventory.slots) {
    if (remaining <= 0) break;
    if (slot.itemId === itemId && slot.quantity < props.maxStack) {
      const canAdd = Math.min(remaining, props.maxStack - slot.quantity);
      slot.quantity += canAdd;
      remaining -= canAdd;
    }
  }

  // Second pass: fill empty slots
  for (const slot of inventory.slots) {
    if (remaining <= 0) break;
    if (slot.itemId === null) {
      const canAdd = Math.min(remaining, props.maxStack);
      slot.itemId = itemId;
      slot.quantity = canAdd;
      remaining -= canAdd;
    }
  }

  return remaining;
}

/** Remove items from a specific slot. Returns true if successful. */
export function removeFromSlot(inventory: Inventory, slotIndex: number, quantity: number): boolean {
  const slot = inventory.slots[slotIndex];
  if (!slot || slot.itemId === null || slot.quantity < quantity) return false;

  slot.quantity -= quantity;
  if (slot.quantity <= 0) {
    slot.itemId = null;
    slot.quantity = 0;
  }
  return true;
}

/** Remove items by ItemId from anywhere in inventory. Returns quantity actually removed. */
export function removeItem(inventory: Inventory, itemId: ItemId, quantity: number): number {
  let remaining = quantity;

  for (const slot of inventory.slots) {
    if (remaining <= 0) break;
    if (slot.itemId === itemId) {
      const toRemove = Math.min(remaining, slot.quantity);
      slot.quantity -= toRemove;
      remaining -= toRemove;
      if (slot.quantity <= 0) {
        slot.itemId = null;
        slot.quantity = 0;
      }
    }
  }

  return quantity - remaining;
}

/** Swap two inventory slots */
export function swapSlots(inventory: Inventory, fromIndex: number, toIndex: number): void {
  const from = inventory.slots[fromIndex];
  const to = inventory.slots[toIndex];

  // If same item type, try to stack
  if (from.itemId !== null && from.itemId === to.itemId) {
    const props = ITEM_PROPERTIES[from.itemId];
    const canMove = Math.min(from.quantity, props.maxStack - to.quantity);
    if (canMove > 0) {
      to.quantity += canMove;
      from.quantity -= canMove;
      if (from.quantity <= 0) {
        from.itemId = null;
        from.quantity = 0;
      }
      return;
    }
  }

  // Otherwise swap
  const tempId = from.itemId;
  const tempQty = from.quantity;
  from.itemId = to.itemId;
  from.quantity = to.quantity;
  to.itemId = tempId;
  to.quantity = tempQty;
}

/** Split a stack in half, placing the other half in targetSlot (must be empty or same item) */
export function splitStack(inventory: Inventory, slotIndex: number, targetIndex: number): boolean {
  const source = inventory.slots[slotIndex];
  const target = inventory.slots[targetIndex];

  if (source.itemId === null || source.quantity <= 1) return false;
  if (target.itemId !== null && target.itemId !== source.itemId) return false;

  const half = Math.floor(source.quantity / 2);

  if (target.itemId === null) {
    target.itemId = source.itemId;
    target.quantity = half;
  } else {
    const props = ITEM_PROPERTIES[source.itemId];
    const canAdd = Math.min(half, props.maxStack - target.quantity);
    if (canAdd <= 0) return false;
    target.quantity += canAdd;
  }

  source.quantity -= half;
  if (source.quantity <= 0) {
    source.itemId = null;
    source.quantity = 0;
  }

  return true;
}

/** Get the item in the currently selected hotbar slot */
export function getSelectedItem(inventory: Inventory): InventorySlot {
  return inventory.slots[inventory.selectedSlot];
}

/** Count total quantity of an item across inventory */
export function countItem(inventory: Inventory, itemId: ItemId): number {
  let total = 0;
  for (const slot of inventory.slots) {
    if (slot.itemId === itemId) total += slot.quantity;
  }
  return total;
}
