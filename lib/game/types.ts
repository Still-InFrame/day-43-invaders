export interface Player {
  x: number;
  y: number;
  cooldown: number;
  spreadTimer: number; // >0 while the spread-shot power-up is active
  invuln: number; // >0 while invulnerable after a hit
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Bug {
  x: number;
  y: number;
  row: number;
  col: number;
  alive: boolean;
}

export interface PowerUp {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface ShieldCell {
  x: number;
  y: number;
  hp: number;
}

export interface Input {
  left: boolean;
  right: boolean;
  fire: boolean;
}

export interface GameState {
  player: Player;
  playerBullets: Bullet[];
  bugBullets: Bullet[];
  bugs: Bug[];
  bugDir: 1 | -1;
  bugFireTimer: number;
  powerUps: PowerUp[];
  particles: Particle[];
  shields: ShieldCell[];
  score: number;
  wave: number;
  lives: number;
  over: boolean;
  shake: number; // screen-shake magnitude, decays over time
  flash: number; // white flash on player hit, decays
}

// Effects the engine wants the host to play as sounds this frame.
export interface StepEffects {
  shoot: boolean;
  explode: boolean;
  powerup: boolean;
  playerHit: boolean;
  waveClear: boolean;
}
