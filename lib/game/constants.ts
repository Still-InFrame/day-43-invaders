// Central tuning knobs for the game. Logical resolution is fixed; the canvas is
// scaled to fit the viewport, so every value here is in "logical" pixels and the
// game plays identically on desktop and mobile.

export const WIDTH = 480;
export const HEIGHT = 640;

// Player ship
export const PLAYER_W = 38;
export const PLAYER_H = 18;
export const PLAYER_Y = HEIGHT - 46;
export const PLAYER_SPEED = 280; // px/sec
export const PLAYER_FIRE_COOLDOWN = 0.34; // sec between shots
export const PLAYER_INVULN = 1.6; // sec of invulnerability after a hit
export const START_LIVES = 3;

// Bullets
export const PLAYER_BULLET_SPEED = 560;
export const PLAYER_BULLET_W = 4;
export const PLAYER_BULLET_H = 14;
export const BUG_BULLET_SPEED = 240;
export const BUG_BULLET_W = 4;
export const BUG_BULLET_H = 12;

// Bug grid
export const BUG_ROWS = 5;
export const BUG_COLS = 11;
export const BUG_W = 26;
export const BUG_H = 20;
export const BUG_GAP_X = 14;
export const BUG_GAP_Y = 16;
export const BUG_TOP = 84;
export const BUG_STEP_DOWN = 18; // px dropped when the swarm hits an edge
export const BUG_BASE_SPEED = 26; // px/sec at wave 1, full grid
export const BUG_WAVE_SPEEDUP = 0.18; // +18% base speed per wave
export const BUG_KILL_SPEEDUP = 2.4; // multiplier applied as the grid empties

// Row scoring: back rows are worth more (index 0 = back).
export const ROW_POINTS = [40, 30, 20, 20, 10];

// Bug return fire
export const BUG_FIRE_BASE = 1.15; // avg sec between swarm shots at wave 1
export const BUG_FIRE_MIN = 0.35;
export const BUG_FIRE_WAVE_FACTOR = 0.12; // shots get more frequent per wave

// Power-up (spread shot)
export const POWERUP_DROP_CHANCE = 0.09;
export const POWERUP_SPEED = 95;
export const POWERUP_SIZE = 20;
export const SPREAD_DURATION = 8; // sec
export const SPREAD_ANGLE = 0.32; // radians of the side shots

// Shields / bunkers
export const SHIELD_COUNT = 4;
export const SHIELD_COLS = 6;
export const SHIELD_ROWS = 4;
export const SHIELD_CELL = 9; // px per destructible cell
export const SHIELD_Y = HEIGHT - 130;
export const SHIELD_CELL_HP = 2;

// Palette (neon synthwave)
export const COLORS = {
  bg0: "#0b0420",
  bg1: "#1a0836",
  grid: "#ff2fb9",
  gridFar: "#3a1a6b",
  player: "#38e8ff",
  playerGlow: "#38e8ff",
  bullet: "#fdfd6b",
  bugBullet: "#ff5d5d",
  shield: "#39ff14",
  powerup: "#ffca3a",
  text: "#e8e6ff",
  rows: ["#ff4fd8", "#c86bff", "#7b8bff", "#4fe3ff", "#5dff9c"],
};
