import Phaser from 'phaser';
import { TILE_SIZE, CHUNK_SIZE, RENDER_DISTANCE, WORLD_HEIGHT, SCALED_TILE, SCALE } from '../config';
import { WorldManager } from '../shared/simulation/WorldManager';
import { TileId, Chunk } from '../shared/types/world';
import { Inventory, ItemId } from '../shared/types/inventory';
import { TILE_DROPS } from '../shared/constants/tileDrops';
import { ITEM_PROPERTIES } from '../shared/constants/items';
import { createInventory, addItem, getSelectedItem } from '../shared/simulation/InventoryManager';
import { PlayerEntity } from '../entities/PlayerEntity';
import { ItemDropEntity } from '../entities/ItemDropEntity';
import { MiningSystem } from '../systems/MiningSystem';
import { saveGame, loadGame } from '../systems/SaveSystem';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const PLACE_REACH = 4;

export class GameScene extends Phaser.Scene {
  private worldManager!: WorldManager;
  private player!: PlayerEntity;
  private inventory!: Inventory;
  private tileGraphics!: Map<string, Phaser.GameObjects.RenderTexture>;
  private lastChunkX = -999;
  private lastChunkY = -999;
  private worldSeed = 12345;
  private miningSystem!: MiningSystem;
  private itemDrops: ItemDropEntity[] = [];
  private inventoryOpen = false;
  private lastAutoSave = 0;
  private dirtyChunks: Set<string> = new Set();

  constructor() {
    super({ key: 'Game' });
  }

  async create(): Promise<void> {
    this.tileGraphics = new Map();
    this.itemDrops = [];
    this.dirtyChunks = new Set();

    // Try loading saved game
    const saveData = await loadGame();

    if (saveData) {
      this.worldSeed = saveData.seed;
      this.inventory = saveData.inventory;
      this.worldManager = new WorldManager(this.worldSeed);

      // Restore modified chunks
      for (const chunkData of saveData.chunks) {
        const chunk = this.worldManager.getChunk(chunkData.x, chunkData.y);
        for (let y = 0; y < chunkData.tiles.length; y++) {
          for (let x = 0; x < chunkData.tiles[y].length; x++) {
            chunk.tiles[y][x] = {
              id: chunkData.tiles[y][x].id as TileId,
              damage: chunkData.tiles[y][x].damage,
            };
          }
        }
      }

      // Create player at saved position
      this.player = new PlayerEntity(this, saveData.player.x, saveData.player.y);
    } else {
      this.inventory = createInventory();
      this.worldManager = new WorldManager(this.worldSeed);

      // Give starting items
      addItem(this.inventory, ItemId.WOOD_PICKAXE, 1);
      addItem(this.inventory, ItemId.WOOD_AXE, 1);
      addItem(this.inventory, ItemId.TORCH, 5);

      const spawnX = 0;
      const spawnY = this.worldManager.findSpawnY(spawnX);
      this.player = new PlayerEntity(this, spawnX * SCALED_TILE, spawnY * SCALED_TILE);
    }

    // Mining system
    this.miningSystem = new MiningSystem(this, this.worldManager, this.inventory, (tileX, tileY, tileId) => {
      this.onTileBreak(tileX, tileY, tileId);
    });

    // Camera
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(
      -10000 * TILE_SIZE * SCALE,
      0,
      20000 * TILE_SIZE * SCALE,
      WORLD_HEIGHT * TILE_SIZE * SCALE,
    );
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Initial chunk load
    this.updateChunks();

    // Launch UI scene
    this.scene.launch('UI', { inventory: this.inventory });

    // Inventory toggle (E key)
    this.input.keyboard!.on('keydown-E', () => {
      this.toggleInventory();
    });

    // Right-click to place blocks
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.handleBlockPlace(pointer);
      }
    });

    // Disable right-click context menu
    this.input.mouse!.disableContextMenu();

    this.lastAutoSave = this.time.now;
  }

  update(time: number, delta: number): void {
    if (!this.player) return;

    // Always run physics collision and chunks (even with inventory open)
    this.updateChunks();
    this.handleTileCollision();

    if (this.inventoryOpen) {
      // Stop player movement while inventory is open
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.x = 0;
      return;
    }

    this.player.update(time, delta);

    // Mining
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.miningSystem.update(
      delta,
      this.player.sprite.x,
      this.player.sprite.y,
      worldPoint.x,
      worldPoint.y,
      pointer.isDown && !pointer.rightButtonDown(),
    );

    // Item drops
    this.updateItemDrops(time);

    // Auto-save
    if (time - this.lastAutoSave > AUTO_SAVE_INTERVAL) {
      this.autoSave();
      this.lastAutoSave = time;
    }
  }

  private onTileBreak(tileX: number, tileY: number, tileId: TileId): void {
    // Re-render affected chunk
    const { cx, cy } = this.worldManager.worldToChunk(tileX, tileY);
    const chunk = this.worldManager.getChunk(cx, cy);
    this.renderChunk(chunk);
    this.dirtyChunks.add(`${cx},${cy}`);

    // Spawn item drop
    const drop = TILE_DROPS[tileId];
    if (drop) {
      const entity = new ItemDropEntity(this, tileX, tileY, drop.itemId, drop.quantity);
      this.itemDrops.push(entity);
    }
  }

  private handleBlockPlace(pointer: Phaser.Input.Pointer): void {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tileX = Math.floor(worldPoint.x / SCALED_TILE);
    const tileY = Math.floor(worldPoint.y / SCALED_TILE);

    // Check reach
    const playerTileX = Math.floor(this.player.sprite.x / SCALED_TILE);
    const playerTileY = Math.floor(this.player.sprite.y / SCALED_TILE);
    if (Math.abs(tileX - playerTileX) > PLACE_REACH || Math.abs(tileY - playerTileY) > PLACE_REACH) {
      return;
    }

    // Target must be air
    const tile = this.worldManager.getTile(tileX, tileY);
    if (tile.id !== TileId.AIR) return;

    // Must have adjacent solid tile (support)
    const hasSupport =
      this.worldManager.isSolid(tileX - 1, tileY) ||
      this.worldManager.isSolid(tileX + 1, tileY) ||
      this.worldManager.isSolid(tileX, tileY - 1) ||
      this.worldManager.isSolid(tileX, tileY + 1);
    if (!hasSupport) return;

    // Check selected item is placeable
    const selected = getSelectedItem(this.inventory);
    if (!selected.itemId) return;
    const itemProps = ITEM_PROPERTIES[selected.itemId];
    if (!itemProps.placeable) return;

    // Map item to tile
    const tileIdToPlace = this.itemToTile(selected.itemId);
    if (tileIdToPlace === null) return;

    // Don't place if player overlaps the tile
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const playerLeft = this.player.sprite.x;
    const playerRight = this.player.sprite.x + body.width;
    const playerTop = this.player.sprite.y;
    const playerBottom = this.player.sprite.y + body.height;
    const tileLeft = tileX * SCALED_TILE;
    const tileRight = tileLeft + SCALED_TILE;
    const tileTop = tileY * SCALED_TILE;
    const tileBottom = tileTop + SCALED_TILE;
    if (playerRight > tileLeft && playerLeft < tileRight && playerBottom > tileTop && playerTop < tileBottom) {
      return;
    }

    // Place it
    this.worldManager.setTile(tileX, tileY, tileIdToPlace);
    selected.quantity--;
    if (selected.quantity <= 0) {
      selected.itemId = null;
      selected.quantity = 0;
    }

    // Re-render chunk
    const { cx, cy } = this.worldManager.worldToChunk(tileX, tileY);
    const chunk = this.worldManager.getChunk(cx, cy);
    this.renderChunk(chunk);
    this.dirtyChunks.add(`${cx},${cy}`);
  }

  private itemToTile(itemId: ItemId): TileId | null {
    const mapping: Partial<Record<ItemId, TileId>> = {
      [ItemId.DIRT]: TileId.DIRT,
      [ItemId.STONE]: TileId.STONE,
      [ItemId.SAND]: TileId.SAND,
      [ItemId.WOOD]: TileId.WOOD,
      [ItemId.GRASS_BLOCK]: TileId.GRASS,
      [ItemId.PLANKS]: TileId.WOOD, // placeholder until planks tile exists
    };
    return mapping[itemId] ?? null;
  }

  private updateItemDrops(time: number): void {
    const playerCenterX = this.player.sprite.x + (this.player.sprite.body as Phaser.Physics.Arcade.Body).width / 2;
    const playerCenterY = this.player.sprite.y + (this.player.sprite.body as Phaser.Physics.Arcade.Body).height / 2;

    for (let i = this.itemDrops.length - 1; i >= 0; i--) {
      const drop = this.itemDrops[i];
      const shouldCollect = drop.update(time, playerCenterX, playerCenterY);

      if (shouldCollect && drop.collected) {
        const remainder = addItem(this.inventory, drop.itemId, drop.quantity);
        if (remainder === 0) {
          drop.destroy();
          this.itemDrops.splice(i, 1);
        } else {
          // Inventory full, keep some on ground
          drop.quantity = remainder;
          drop.collected = false;
        }
      }
    }
  }

  private toggleInventory(): void {
    if (this.inventoryOpen) {
      this.scene.stop('Inventory');
      this.scene.resume('UI');
      this.inventoryOpen = false;
    } else {
      this.scene.launch('Inventory', { inventory: this.inventory });
      this.scene.pause('UI');
      this.inventoryOpen = true;
    }
  }

  private async autoSave(): Promise<void> {
    const chunks = this.worldManager.getLoadedChunks();
    await saveGame(
      this.worldSeed,
      this.inventory,
      this.player.sprite.x,
      this.player.sprite.y,
      chunks,
    );
  }

  // --- Chunk rendering (unchanged from Phase 1) ---

  private updateChunks(): void {
    const playerTileX = Math.floor(this.player.sprite.x / (TILE_SIZE * SCALE));
    const playerTileY = Math.floor(this.player.sprite.y / (TILE_SIZE * SCALE));
    const currentChunkX = Math.floor(playerTileX / CHUNK_SIZE);
    const currentChunkY = Math.floor(playerTileY / CHUNK_SIZE);

    if (currentChunkX === this.lastChunkX && currentChunkY === this.lastChunkY) {
      return;
    }

    this.lastChunkX = currentChunkX;
    this.lastChunkY = currentChunkY;

    const { loaded, unloaded } = this.worldManager.updateLoadedChunks(playerTileX, playerTileY, RENDER_DISTANCE);

    for (const key of unloaded) {
      const gfx = this.tileGraphics.get(key);
      if (gfx) {
        gfx.destroy();
        this.tileGraphics.delete(key);
      }
    }

    for (const chunk of loaded) {
      this.renderChunk(chunk);
    }

    for (const chunk of this.worldManager.getLoadedChunks()) {
      const key = `${chunk.x},${chunk.y}`;
      if (!this.tileGraphics.has(key)) {
        this.renderChunk(chunk);
      }
    }
  }

  private renderChunk(chunk: Chunk): void {
    const key = `${chunk.x},${chunk.y}`;

    const old = this.tileGraphics.get(key);
    if (old) old.destroy();

    const chunkPixelX = chunk.x * CHUNK_SIZE * TILE_SIZE * SCALE;
    const chunkPixelY = chunk.y * CHUNK_SIZE * TILE_SIZE * SCALE;
    const chunkPixelSize = CHUNK_SIZE * TILE_SIZE * SCALE;

    const rt = this.add.renderTexture(chunkPixelX, chunkPixelY, chunkPixelSize, chunkPixelSize);
    rt.setOrigin(0, 0);
    rt.setDepth(-1);

    // Stamp each tile from the tileset texture
    const tilesetImage = this.textures.get('tileset').getSourceImage() as HTMLCanvasElement;
    // Create a temporary canvas to draw each tile scaled
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = chunkPixelSize;
    tmpCanvas.height = chunkPixelSize;
    const tmpCtx = tmpCanvas.getContext('2d')!;
    tmpCtx.imageSmoothingEnabled = false;

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const tile = chunk.tiles[ly][lx];
        if (tile.id === TileId.AIR) continue;

        // Source position in tileset strip
        const srcX = tile.id * TILE_SIZE;
        tmpCtx.drawImage(
          tilesetImage,
          srcX, 0, TILE_SIZE, TILE_SIZE,
          lx * TILE_SIZE * SCALE, ly * TILE_SIZE * SCALE, TILE_SIZE * SCALE, TILE_SIZE * SCALE,
        );
      }
    }

    // Draw the canvas into the RenderTexture
    const tmpTex = this.textures.addCanvas('_chunk_tmp_' + key, tmpCanvas);
    const tmpImg = this.add.image(0, 0, '_chunk_tmp_' + key);
    tmpImg.setOrigin(0, 0);
    tmpImg.setVisible(false);
    rt.draw(tmpImg);
    tmpImg.destroy();
    this.textures.remove('_chunk_tmp_' + key);

    this.tileGraphics.set(key, rt);
  }

  // --- Tile collision (unchanged from Phase 1) ---

  private handleTileCollision(): void {
    const sprite = this.player.sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;

    const leftTile = Math.floor(sprite.x / SCALED_TILE) - 1;
    const rightTile = Math.ceil((sprite.x + body.width) / SCALED_TILE) + 1;
    const topTile = Math.floor(sprite.y / SCALED_TILE) - 1;
    const bottomTile = Math.ceil((sprite.y + body.height) / SCALED_TILE) + 1;

    let onGround = false;

    for (let ty = topTile; ty <= bottomTile; ty++) {
      for (let tx = leftTile; tx <= rightTile; tx++) {
        if (!this.worldManager.isSolid(tx, ty)) continue;

        const tileLeft = tx * SCALED_TILE;
        const tileTop = ty * SCALED_TILE;
        const tileRight = tileLeft + SCALED_TILE;
        const tileBottom = tileTop + SCALED_TILE;

        const playerLeft = sprite.x;
        const playerRight = sprite.x + body.width;
        const playerTop = sprite.y;
        const playerBottom = sprite.y + body.height;

        if (
          playerRight <= tileLeft ||
          playerLeft >= tileRight ||
          playerBottom <= tileTop ||
          playerTop >= tileBottom
        ) {
          continue;
        }

        const overlapLeft = playerRight - tileLeft;
        const overlapRight = tileRight - playerLeft;
        const overlapTop = playerBottom - tileTop;
        const overlapBottom = tileBottom - playerTop;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && body.velocity.y >= 0) {
          sprite.y = tileTop - body.height;
          body.velocity.y = 0;
          onGround = true;
        } else if (minOverlap === overlapBottom && body.velocity.y < 0) {
          sprite.y = tileBottom;
          body.velocity.y = 0;
        } else if (minOverlap === overlapLeft) {
          sprite.x = tileLeft - body.width;
          body.velocity.x = 0;
        } else if (minOverlap === overlapRight) {
          sprite.x = tileRight;
          body.velocity.x = 0;
        }
      }
    }

    this.player.onGround = onGround;
  }
}
