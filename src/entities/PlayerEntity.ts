import Phaser from 'phaser';
import { TILE_SIZE, SCALE, PLAYER_SPEED, PLAYER_JUMP_VELOCITY } from '../config';

export class PlayerEntity {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public onGround = false;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private facingRight = true;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create sprite from placeholder
    const playerWidth = TILE_SIZE;
    const playerHeight = TILE_SIZE * 2;

    // Create frames from the canvas texture
    const texture = scene.textures.get('player');
    if (texture.key === 'player') {
      // Add frames manually
      texture.add('idle', 0, 0, 0, playerWidth, playerHeight);
      texture.add('walk1', 0, playerWidth, 0, playerWidth, playerHeight);
      texture.add('walk2', 0, playerWidth * 2, 0, playerWidth, playerHeight);
      texture.add('jump', 0, playerWidth * 3, 0, playerWidth, playerHeight);
    }

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setOrigin(0, 0);
    this.sprite.setScale(SCALE);
    this.sprite.setDepth(10);

    // Physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(playerWidth, playerHeight);
    body.setCollideWorldBounds(false);
    body.setMaxVelocityY(800);

    // Create animations
    scene.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player', frame: 'idle' }],
      frameRate: 1,
    });

    scene.anims.create({
      key: 'player-walk',
      frames: [
        { key: 'player', frame: 'walk1' },
        { key: 'player', frame: 'idle' },
        { key: 'player', frame: 'walk2' },
        { key: 'player', frame: 'idle' },
      ],
      frameRate: 8,
      repeat: -1,
    });

    scene.anims.create({
      key: 'player-jump',
      frames: [{ key: 'player', frame: 'jump' }],
      frameRate: 1,
    });

    // Input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  update(_time: number, _delta: number): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Horizontal movement
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const jump = this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space.isDown;

    if (left) {
      body.velocity.x = -PLAYER_SPEED;
      this.facingRight = false;
    } else if (right) {
      body.velocity.x = PLAYER_SPEED;
      this.facingRight = true;
    } else {
      body.velocity.x = 0;
    }

    // Jumping
    if (jump && this.onGround) {
      body.velocity.y = PLAYER_JUMP_VELOCITY;
      this.onGround = false;
    }

    // Flip sprite
    this.sprite.setFlipX(!this.facingRight);

    // Animations
    if (!this.onGround) {
      this.sprite.anims.play('player-jump', true);
    } else if (left || right) {
      this.sprite.anims.play('player-walk', true);
    } else {
      this.sprite.anims.play('player-idle', true);
    }
  }
}
