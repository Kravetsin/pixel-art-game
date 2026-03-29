import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Inventory, INVENTORY_SIZE, HOTBAR_SIZE } from '../shared/types/inventory';
import { ITEM_PROPERTIES } from '../shared/constants/items';
import { swapSlots, splitStack } from '../shared/simulation/InventoryManager';

const SLOT_SIZE = 40;
const SLOT_GAP = 4;
const COLS = 10;
const ROWS = Math.ceil(INVENTORY_SIZE / COLS);
const PANEL_PADDING = 16;
const ICON_SIZE = 32;
const ICON_OFFSET = (SLOT_SIZE - ICON_SIZE) / 2;

export class InventoryScene extends Phaser.Scene {
  private inventory!: Inventory;
  private closing = false;
  private dragging = false;
  private dragFromSlot = -1;
  private dragIcon!: Phaser.GameObjects.Image | null;
  private dragText!: Phaser.GameObjects.Text;
  private slotZones: Phaser.GameObjects.Zone[] = [];
  private background!: Phaser.GameObjects.Rectangle;
  private itemIcons: (Phaser.GameObjects.Image | null)[] = [];
  private quantityTexts: Phaser.GameObjects.Text[] = [];
  private nameTexts: Phaser.GameObjects.Text[] = [];
  private gridStartX = 0;
  private gridStartY = 0;

  constructor() {
    super({ key: 'Inventory' });
  }

  init(data: { inventory: Inventory }): void {
    this.inventory = data.inventory;
    this.closing = false;
    this.dragging = false;
    this.dragFromSlot = -1;
    this.slotZones = [];
    this.quantityTexts = [];
    this.nameTexts = [];
    this.itemIcons = [];
    this.dragIcon = null;
  }

  create(): void {
    const totalW = COLS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + PANEL_PADDING * 2;
    const totalH = ROWS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + PANEL_PADDING * 2 + 30;
    const panelX = (GAME_WIDTH - totalW) / 2;
    const panelY = (GAME_HEIGHT - totalH) / 2;

    this.gridStartX = panelX + PANEL_PADDING;
    this.gridStartY = panelY + PANEL_PADDING + 28;

    // Darkened background overlay
    this.background = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);
    this.background.setDepth(0);

    // Panel background
    const panel = this.add.graphics();
    panel.fillStyle(0x222222, 0.9);
    panel.fillRoundedRect(panelX, panelY, totalW, totalH, 8);
    panel.lineStyle(2, 0x666666);
    panel.strokeRoundedRect(panelX, panelY, totalW, totalH, 8);
    panel.setDepth(1);

    // Title
    const titleText = this.add.text(GAME_WIDTH / 2, panelY + 14, 'Inventory', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    titleText.setOrigin(0.5, 0);
    titleText.setDepth(2);

    // Static slot backgrounds
    const slotBgGfx = this.add.graphics();
    slotBgGfx.setDepth(2);
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = this.gridStartX + col * (SLOT_SIZE + SLOT_GAP);
      const y = this.gridStartY + row * (SLOT_SIZE + SLOT_GAP);
      const isHotbar = i < HOTBAR_SIZE;

      slotBgGfx.fillStyle(isHotbar ? 0x3a3a2a : 0x2a2a2a, 1);
      slotBgGfx.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 3);
      slotBgGfx.lineStyle(1, isHotbar ? 0x777744 : 0x555555);
      slotBgGfx.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 3);
    }

    // Initialize icon slots
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      this.itemIcons.push(null);
    }

    // Per-slot texts and zones
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = this.gridStartX + col * (SLOT_SIZE + SLOT_GAP);
      const y = this.gridStartY + row * (SLOT_SIZE + SLOT_GAP);

      // Quantity text
      const qtyText = this.add.text(x + SLOT_SIZE - 3, y + SLOT_SIZE - 3, '', {
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        fontFamily: 'monospace',
      });
      qtyText.setOrigin(1, 1);
      qtyText.setDepth(5);
      this.quantityTexts.push(qtyText);

      // Name text (tooltip)
      const nameText = this.add.text(x + SLOT_SIZE / 2, y - 2, '', {
        fontSize: '9px',
        color: '#ffff88',
        stroke: '#000000',
        strokeThickness: 2,
        fontFamily: 'monospace',
      });
      nameText.setOrigin(0.5, 1);
      nameText.setDepth(10);
      nameText.setVisible(false);
      this.nameTexts.push(nameText);

      // Interactive zone
      const zone = this.add.zone(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE);
      zone.setInteractive({ useHandCursor: true });
      zone.setDepth(6);

      zone.on('pointerover', () => {
        const slot = this.inventory.slots[i];
        if (slot.itemId) {
          nameText.setText(ITEM_PROPERTIES[slot.itemId].name);
          nameText.setVisible(true);
        }
      });
      zone.on('pointerout', () => {
        nameText.setVisible(false);
      });
      zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (this.inventory.slots[i].itemId === null && !this.dragging) return;

        if (pointer.rightButtonDown() && this.inventory.slots[i].itemId) {
          for (let j = 0; j < INVENTORY_SIZE; j++) {
            if (j !== i && this.inventory.slots[j].itemId === null) {
              splitStack(this.inventory, i, j);
              break;
            }
          }
          return;
        }

        if (!this.dragging && this.inventory.slots[i].itemId) {
          this.dragging = true;
          this.dragFromSlot = i;
          // Create drag icon
          if (this.dragIcon && this.dragIcon.active) this.dragIcon.destroy();
          this.dragIcon = this.add.image(pointer.x, pointer.y, 'items', this.inventory.slots[i].itemId!);
          this.dragIcon.setOrigin(0.5, 0.5);
          this.dragIcon.setScale(ICON_SIZE / 16);
          this.dragIcon.setDepth(20);
          this.dragIcon.setAlpha(0.85);
          const qty = this.inventory.slots[i].quantity;
          this.dragText.setText(qty > 1 ? `${qty}` : '');
          this.dragText.setVisible(true);
        } else if (this.dragging) {
          swapSlots(this.inventory, this.dragFromSlot, i);
          this.stopDrag();
        }
      });

      this.slotZones.push(zone);
    }

    // Drag text
    this.dragText = this.add.text(0, 0, '', {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      fontFamily: 'monospace',
    });
    this.dragText.setOrigin(1, 1);
    this.dragText.setDepth(21);
    this.dragText.setVisible(false);

    // Follow pointer while dragging
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.dragging && this.dragIcon && this.dragIcon.active) {
        this.dragIcon.setPosition(pointer.x, pointer.y);
        this.dragText.setPosition(pointer.x + 14, pointer.y + 14);
      }
    });

    // Cancel drag on click outside
    this.background.setInteractive();
    this.background.on('pointerdown', () => {
      if (this.dragging) this.stopDrag();
    });

    // Close with E or Escape
    this.input.keyboard!.on('keydown-E', () => this.closeInventory());
    this.input.keyboard!.on('keydown-ESC', () => this.closeInventory());

    this.input.mouse!.disableContextMenu();
  }

  private stopDrag(): void {
    this.dragging = false;
    this.dragFromSlot = -1;
    if (this.dragIcon && this.dragIcon.active) {
      this.dragIcon.destroy();
      this.dragIcon = null;
    }
    this.dragText.setVisible(false);
  }

  private closeInventory(): void {
    this.closing = true;
    this.scene.stop('Inventory');
    this.scene.resume('Game');
    this.scene.resume('UI');
  }

  update(): void {
    if (this.closing) return;

    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = this.gridStartX + col * (SLOT_SIZE + SLOT_GAP);
      const y = this.gridStartY + row * (SLOT_SIZE + SLOT_GAP);

      const slot = this.inventory.slots[i];
      const text = this.quantityTexts[i];

      if (slot.itemId) {
        // Create or update icon
        const icon = this.itemIcons[i];
        if (icon && icon.active && icon.frame.name === slot.itemId) {
          // Already correct
        } else {
          if (icon && icon.active) icon.destroy();
          const newIcon = this.add.image(x + ICON_OFFSET, y + ICON_OFFSET, 'items', slot.itemId);
          newIcon.setOrigin(0, 0);
          newIcon.setScale(ICON_SIZE / 16);
          newIcon.setDepth(4);
          this.itemIcons[i] = newIcon;
        }
        if (text) text.setText(slot.quantity > 1 ? `${slot.quantity}` : '');
      } else {
        const icon = this.itemIcons[i];
        if (icon && icon.active) {
          icon.destroy();
          this.itemIcons[i] = null;
        }
        if (text) text.setText('');
      }
    }
  }
}
