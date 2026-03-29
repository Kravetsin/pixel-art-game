import Phaser from 'phaser';
import { SCALE, SCALED_TILE } from '../config';
import { ItemId } from '../shared/types/inventory';

const PICKUP_DISTANCE = SCALED_TILE * 1.5;
const BOB_SPEED = 3;
const BOB_AMOUNT = 4;
const DROP_ICON_SCALE = SCALE * 0.75;

export class ItemDropEntity {
  public sprite: Phaser.GameObjects.Image;
  public itemId: ItemId;
  public quantity: number;
  public collected = false;
  private baseY: number;
  private spawnTime: number;
  private countText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number, itemId: ItemId, quantity: number) {
    this.itemId = itemId;
    this.quantity = quantity;
    this.spawnTime = scene.time.now;

    // Use the item icon texture
    this.sprite = scene.add.image(
      worldX * SCALED_TILE + SCALED_TILE / 2,
      worldY * SCALED_TILE + SCALED_TILE / 2,
      'items',
      itemId,
    );
    this.sprite.setScale(DROP_ICON_SCALE);
    this.sprite.setDepth(5);

    this.baseY = this.sprite.y;

    // Quantity label
    this.countText = scene.add.text(this.sprite.x, this.sprite.y - 12, '', {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.countText.setOrigin(0.5, 1);
    this.countText.setDepth(6);
    if (quantity > 1) {
      this.countText.setText(`${quantity}`);
    }
  }

  update(time: number, playerX: number, playerY: number): boolean {
    if (this.collected) return true;

    // Bobbing animation
    const elapsed = (time - this.spawnTime) / 1000;
    this.sprite.y = this.baseY + Math.sin(elapsed * BOB_SPEED) * BOB_AMOUNT;
    this.countText.setPosition(this.sprite.x, this.sprite.y - 12);

    // Check pickup distance
    const dx = this.sprite.x - playerX;
    const dy = this.sprite.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < PICKUP_DISTANCE) {
      this.collected = true;
      return true;
    }

    return false;
  }

  destroy(): void {
    this.sprite.destroy();
    this.countText.destroy();
  }
}
