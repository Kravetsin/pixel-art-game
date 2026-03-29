import Phaser from 'phaser';
import { TILE_SIZE, SCALE, SCALED_TILE } from '../config';
import { WorldManager } from '../shared/simulation/WorldManager';
import { TileId } from '../shared/types/world';
import { TILE_PROPERTIES } from '../shared/constants/tiles';
import { TILE_DROPS, getMiningSpeedMultiplier } from '../shared/constants/tileDrops';
import { Inventory } from '../shared/types/inventory';
import { ITEM_PROPERTIES } from '../shared/constants/items';
import { getSelectedItem } from '../shared/simulation/InventoryManager';

const MINING_REACH = 4; // tiles
const BASE_MINING_RATE = 1.5; // damage per second with bare hands

export interface MiningState {
  active: boolean;
  tileX: number;
  tileY: number;
  progress: number; // 0 to 1
  damage: number;
}

export class MiningSystem {
  private scene: Phaser.Scene;
  private worldManager: WorldManager;
  private inventory: Inventory;
  private state: MiningState = { active: false, tileX: 0, tileY: 0, progress: 0, damage: 0 };
  private progressBar: Phaser.GameObjects.Graphics;
  private highlightRect: Phaser.GameObjects.Graphics;
  private onTileBreak: (tileX: number, tileY: number, tileId: TileId) => void;

  constructor(
    scene: Phaser.Scene,
    worldManager: WorldManager,
    inventory: Inventory,
    onTileBreak: (tileX: number, tileY: number, tileId: TileId) => void,
  ) {
    this.scene = scene;
    this.worldManager = worldManager;
    this.inventory = inventory;
    this.onTileBreak = onTileBreak;

    this.highlightRect = scene.add.graphics();
    this.highlightRect.setDepth(5);
    this.progressBar = scene.add.graphics();
    this.progressBar.setDepth(20);
  }

  update(
    delta: number,
    playerX: number,
    playerY: number,
    pointerWorldX: number,
    pointerWorldY: number,
    isPointerDown: boolean,
  ): void {
    const tileX = Math.floor(pointerWorldX / SCALED_TILE);
    const tileY = Math.floor(pointerWorldY / SCALED_TILE);

    // Draw tile highlight
    this.highlightRect.clear();
    const tile = this.worldManager.getTile(tileX, tileY);
    if (tile.id !== TileId.AIR) {
      this.highlightRect.lineStyle(2, 0xffffff, 0.5);
      this.highlightRect.strokeRect(
        tileX * SCALED_TILE,
        tileY * SCALED_TILE,
        SCALED_TILE,
        SCALED_TILE,
      );
    }

    // Check reach
    const playerTileX = Math.floor(playerX / SCALED_TILE);
    const playerTileY = Math.floor(playerY / SCALED_TILE);
    const dx = Math.abs(tileX - playerTileX);
    const dy = Math.abs(tileY - playerTileY);
    const inReach = dx <= MINING_REACH && dy <= MINING_REACH;

    if (!isPointerDown || !inReach || tile.id === TileId.AIR || tile.id === TileId.BEDROCK) {
      this.stopMining();
      return;
    }

    // If we changed target tile, restart
    if (tileX !== this.state.tileX || tileY !== this.state.tileY) {
      this.state = { active: true, tileX, tileY, progress: 0, damage: 0 };
    }

    this.state.active = true;

    // Get mining speed from selected tool
    const selectedSlot = getSelectedItem(this.inventory);
    let miningSpeed = BASE_MINING_RATE;
    let toolType = 'none';

    if (selectedSlot.itemId) {
      const itemProps = ITEM_PROPERTIES[selectedSlot.itemId];
      miningSpeed = BASE_MINING_RATE * itemProps.miningSpeed;
      toolType = itemProps.toolType;
    }

    // Apply tool-vs-tile multiplier
    miningSpeed *= getMiningSpeedMultiplier(tile.id, toolType);

    // Accumulate damage
    const tileProps = TILE_PROPERTIES[tile.id];
    this.state.damage += miningSpeed * (delta / 1000);
    this.state.progress = Math.min(this.state.damage / tileProps.hardness, 1);

    // Draw progress bar above tile
    this.drawProgressBar(tileX, tileY, this.state.progress);

    // Tile broken?
    if (this.state.damage >= tileProps.hardness) {
      const brokenTileId = tile.id;
      this.worldManager.setTile(tileX, tileY, TileId.AIR);
      this.onTileBreak(tileX, tileY, brokenTileId);
      this.stopMining();
    }
  }

  private stopMining(): void {
    this.state.active = false;
    this.state.progress = 0;
    this.state.damage = 0;
    this.progressBar.clear();
  }

  private drawProgressBar(tileX: number, tileY: number, progress: number): void {
    this.progressBar.clear();
    if (progress <= 0) return;

    const x = tileX * SCALED_TILE;
    const y = tileY * SCALED_TILE - 8;
    const width = SCALED_TILE;
    const height = 4;

    // Background
    this.progressBar.fillStyle(0x000000, 0.5);
    this.progressBar.fillRect(x, y, width, height);

    // Fill
    this.progressBar.fillStyle(0x00ff00, 0.8);
    this.progressBar.fillRect(x, y, width * progress, height);
  }

  destroy(): void {
    this.highlightRect.destroy();
    this.progressBar.destroy();
  }
}
