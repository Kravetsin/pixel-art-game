import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { Inventory, HOTBAR_SIZE } from '../shared/types/inventory';

const SLOT_SIZE = 40;
const SLOT_GAP = 4;
const HOTBAR_Y_OFFSET = 20;
const ICON_SIZE = 32;
const ICON_OFFSET = (SLOT_SIZE - ICON_SIZE) / 2;

export class UIScene extends Phaser.Scene {
  private inventory!: Inventory;
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private itemIcons: (Phaser.GameObjects.Image | null)[] = [];
  private selectGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'UI' });
  }

  init(data: { inventory: Inventory }): void {
    this.inventory = data.inventory;
  }

  create(): void {
    const totalWidth = HOTBAR_SIZE * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const y = GAME_HEIGHT - SLOT_SIZE - HOTBAR_Y_OFFSET;

    // Static slot backgrounds
    const bgGfx = this.add.graphics();
    bgGfx.setDepth(0);
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      bgGfx.fillStyle(0x000000, 0.6);
      bgGfx.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 4);
      bgGfx.lineStyle(2, 0x555555, 0.8);
      bgGfx.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 4);
    }

    // Item icons — Phaser Images using the 'items' texture frames
    this.itemIcons = [];
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      this.itemIcons.push(null);
    }

    // Quantity texts
    this.slotTexts = [];
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      const text = this.add.text(x + SLOT_SIZE - 4, y + SLOT_SIZE - 4, '', {
        fontSize: '11px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        fontFamily: 'monospace',
      });
      text.setOrigin(1, 1);
      text.setDepth(3);
      this.slotTexts.push(text);
    }

    // Selection frame
    this.selectGfx = this.add.graphics();
    this.selectGfx.setDepth(4);

    // Number key labels
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      const label = this.add.text(x + 3, y + 2, `${(i + 1) % 10}`, {
        fontSize: '9px',
        color: '#aaaaaa',
        fontFamily: 'monospace',
      });
      label.setDepth(5);
    }

    // Keyboard: 1-0 to select slot
    for (let i = 0; i < 10; i++) {
      this.input.keyboard!.on(`keydown-${i === 9 ? 'ZERO' : String.fromCharCode(49 + i)}`, () => {
        this.inventory.selectedSlot = i;
      });
    }

    // Mouse wheel to cycle slots
    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        this.inventory.selectedSlot = (this.inventory.selectedSlot + 1) % HOTBAR_SIZE;
      } else if (deltaY < 0) {
        this.inventory.selectedSlot = (this.inventory.selectedSlot - 1 + HOTBAR_SIZE) % HOTBAR_SIZE;
      }
    });
  }

  update(): void {
    const totalWidth = HOTBAR_SIZE * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const y = GAME_HEIGHT - SLOT_SIZE - HOTBAR_Y_OFFSET;

    // Update item icons
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const slot = this.inventory.slots[i];
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);

      if (slot.itemId) {
        // Check if we need to create or update the icon
        const icon = this.itemIcons[i];
        if (icon && icon.active && icon.frame.name === slot.itemId) {
          // Already showing the correct item
        } else {
          // Remove old icon
          if (icon && icon.active) icon.destroy();
          // Create new icon from items texture
          const newIcon = this.add.image(x + ICON_OFFSET, y + ICON_OFFSET, 'items', slot.itemId);
          newIcon.setOrigin(0, 0);
          newIcon.setScale(ICON_SIZE / 16);
          newIcon.setDepth(2);
          this.itemIcons[i] = newIcon;
        }
        this.slotTexts[i].setText(slot.quantity > 1 ? `${slot.quantity}` : '');
      } else {
        // Remove icon if slot is empty
        const icon = this.itemIcons[i];
        if (icon && icon.active) {
          icon.destroy();
          this.itemIcons[i] = null;
        }
        this.slotTexts[i].setText('');
      }
    }

    // Redraw selection frame
    this.selectGfx.clear();
    const selX = startX + this.inventory.selectedSlot * (SLOT_SIZE + SLOT_GAP);
    this.selectGfx.lineStyle(3, 0xffff00, 1);
    this.selectGfx.strokeRect(selX - 2, y - 2, SLOT_SIZE + 4, SLOT_SIZE + 4);
    this.selectGfx.fillStyle(0xffff00, 0.1);
    this.selectGfx.fillRect(selX - 2, y - 2, SLOT_SIZE + 4, SLOT_SIZE + 4);
  }
}
