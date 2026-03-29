export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface EntityBase {
  id: string;
  position: Position;
  velocity: Velocity;
  width: number;
  height: number;
}

export interface PlayerState extends EntityBase {
  type: 'player';
  health: number;
  maxHealth: number;
  facingRight: boolean;
  onGround: boolean;
}

export type Direction = 'left' | 'right';

export interface ActionMove {
  type: 'MOVE';
  direction: Direction | 'stop';
}

export interface ActionJump {
  type: 'JUMP';
}

export interface ActionMine {
  type: 'MINE';
  tileX: number;
  tileY: number;
}

export type PlayerAction = ActionMove | ActionJump | ActionMine;
