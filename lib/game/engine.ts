import * as C from "./constants";
import type {
  Bug,
  GameState,
  Input,
  ShieldCell,
  StepEffects,
} from "./types";

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

const gridWidth =
  C.BUG_COLS * C.BUG_W + (C.BUG_COLS - 1) * C.BUG_GAP_X;
const gridStartX = (C.WIDTH - gridWidth) / 2;

function buildBugs(): Bug[] {
  const bugs: Bug[] = [];
  for (let row = 0; row < C.BUG_ROWS; row++) {
    for (let col = 0; col < C.BUG_COLS; col++) {
      bugs.push({
        x: gridStartX + col * (C.BUG_W + C.BUG_GAP_X),
        y: C.BUG_TOP + row * (C.BUG_H + C.BUG_GAP_Y),
        row,
        col,
        alive: true,
      });
    }
  }
  return bugs;
}

function buildShields(): ShieldCell[] {
  const cells: ShieldCell[] = [];
  const bunkerW = C.SHIELD_COLS * C.SHIELD_CELL;
  // Spread bunkers evenly across the play area.
  const slot = C.WIDTH / C.SHIELD_COUNT;
  for (let b = 0; b < C.SHIELD_COUNT; b++) {
    const originX = slot * b + (slot - bunkerW) / 2;
    for (let cx = 0; cx < C.SHIELD_COLS; cx++) {
      for (let cy = 0; cy < C.SHIELD_ROWS; cy++) {
        // Carve a small notch out of the underside center for the classic arch.
        const isNotch =
          cy >= C.SHIELD_ROWS - 2 &&
          cx >= C.SHIELD_COLS / 2 - 1 &&
          cx <= C.SHIELD_COLS / 2;
        if (isNotch) continue;
        cells.push({
          x: originX + cx * C.SHIELD_CELL,
          y: C.SHIELD_Y + cy * C.SHIELD_CELL,
          hp: C.SHIELD_CELL_HP,
        });
      }
    }
  }
  return cells;
}

export function createInitialState(): GameState {
  return {
    player: {
      x: C.WIDTH / 2,
      y: C.PLAYER_Y,
      cooldown: 0,
      spreadTimer: 0,
      invuln: 0,
    },
    playerBullets: [],
    bugBullets: [],
    bugs: buildBugs(),
    bugDir: 1,
    bugFireTimer: C.BUG_FIRE_BASE,
    powerUps: [],
    particles: [],
    shields: buildShields(),
    score: 0,
    wave: 1,
    lives: C.START_LIVES,
    over: false,
    shake: 0,
    flash: 0,
  };
}

function nextWave(s: GameState) {
  s.wave += 1;
  s.score += 100; // wave-clear bonus
  s.bugs = buildBugs();
  s.shields = buildShields(); // regenerate cover each wave
  s.bugDir = 1;
  s.bugBullets = [];
  s.playerBullets = [];
  s.bugFireTimer = C.BUG_FIRE_BASE;
}

function spawnParticles(
  s: GameState,
  x: number,
  y: number,
  color: string,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 140;
    const life = 0.3 + Math.random() * 0.4;
    s.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color,
    });
  }
}

function bugSpeed(s: GameState): number {
  const alive = s.bugs.reduce((n, b) => n + (b.alive ? 1 : 0), 0);
  const total = C.BUG_ROWS * C.BUG_COLS;
  const emptied = 1 - alive / total;
  const waveFactor = 1 + (s.wave - 1) * C.BUG_WAVE_SPEEDUP;
  const killFactor = 1 + emptied * C.BUG_KILL_SPEEDUP;
  return C.BUG_BASE_SPEED * waveFactor * killFactor;
}

// Advances the simulation by dt seconds and returns the sound effects triggered.
export function step(s: GameState, dt: number, input: Input): StepEffects {
  const fx: StepEffects = {
    shoot: false,
    explode: false,
    powerup: false,
    playerHit: false,
    waveClear: false,
  };
  if (s.over) return fx;

  const p = s.player;
  p.cooldown = Math.max(0, p.cooldown - dt);
  p.spreadTimer = Math.max(0, p.spreadTimer - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  s.shake = Math.max(0, s.shake - dt * 40);
  s.flash = Math.max(0, s.flash - dt * 4);

  // --- Player movement ---
  const dir = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  p.x += dir * C.PLAYER_SPEED * dt;
  const half = C.PLAYER_W / 2;
  p.x = Math.max(half + 4, Math.min(C.WIDTH - half - 4, p.x));

  // --- Player firing ---
  if (input.fire && p.cooldown <= 0) {
    fx.shoot = true;
    p.cooldown = C.PLAYER_FIRE_COOLDOWN;
    const bx = p.x - C.PLAYER_BULLET_W / 2;
    const by = p.y - C.PLAYER_BULLET_H;
    if (p.spreadTimer > 0) {
      const sp = C.PLAYER_BULLET_SPEED;
      const a = C.SPREAD_ANGLE;
      s.playerBullets.push(
        { x: bx, y: by, vx: 0, vy: -sp },
        { x: bx, y: by, vx: -Math.sin(a) * sp, vy: -Math.cos(a) * sp },
        { x: bx, y: by, vx: Math.sin(a) * sp, vy: -Math.cos(a) * sp },
      );
    } else {
      s.playerBullets.push({ x: bx, y: by, vx: 0, vy: -C.PLAYER_BULLET_SPEED });
    }
  }

  // --- Bug swarm movement ---
  let minX = Infinity;
  let maxX = -Infinity;
  let lowest = -Infinity;
  for (const b of s.bugs) {
    if (!b.alive) continue;
    if (b.x < minX) minX = b.x;
    if (b.x + C.BUG_W > maxX) maxX = b.x + C.BUG_W;
    if (b.y + C.BUG_H > lowest) lowest = b.y + C.BUG_H;
  }
  const aliveCount = s.bugs.reduce((n, b) => n + (b.alive ? 1 : 0), 0);
  if (aliveCount > 0) {
    const speed = bugSpeed(s);
    const dx = s.bugDir * speed * dt;
    const margin = 10;
    const hitEdge =
      (s.bugDir === 1 && maxX + dx > C.WIDTH - margin) ||
      (s.bugDir === -1 && minX + dx < margin);
    if (hitEdge) {
      s.bugDir = (s.bugDir === 1 ? -1 : 1) as 1 | -1;
      for (const b of s.bugs) if (b.alive) b.y += C.BUG_STEP_DOWN;
    } else {
      for (const b of s.bugs) if (b.alive) b.x += dx;
    }
    // Bugs reaching the player line ends the game.
    if (lowest >= C.PLAYER_Y) {
      s.over = true;
      return fx;
    }
  }

  // --- Bug return fire ---
  s.bugFireTimer -= dt;
  if (s.bugFireTimer <= 0 && aliveCount > 0) {
    // Fire from the frontmost bug in a random occupied column.
    const cols = new Map<number, Bug>();
    for (const b of s.bugs) {
      if (!b.alive) continue;
      const cur = cols.get(b.col);
      if (!cur || b.y > cur.y) cols.set(b.col, b);
    }
    const shooters = Array.from(cols.values());
    const shooter = shooters[Math.floor(Math.random() * shooters.length)];
    s.bugBullets.push({
      x: shooter.x + C.BUG_W / 2 - C.BUG_BULLET_W / 2,
      y: shooter.y + C.BUG_H,
      vx: 0,
      vy: C.BUG_BULLET_SPEED,
    });
    const interval = Math.max(
      C.BUG_FIRE_MIN,
      C.BUG_FIRE_BASE * (1 - (s.wave - 1) * C.BUG_FIRE_WAVE_FACTOR),
    );
    s.bugFireTimer = interval * (0.6 + Math.random());
  }

  // --- Advance projectiles / powerups / particles ---
  for (const b of s.playerBullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  for (const b of s.bugBullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  for (const pu of s.powerUps) pu.y += C.POWERUP_SPEED * dt;
  for (const pt of s.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.94;
    pt.vy *= 0.94;
    pt.life -= dt;
  }

  // --- Player bullets vs bugs ---
  for (const bullet of s.playerBullets) {
    if (bullet.y < -20) continue;
    for (const b of s.bugs) {
      if (!b.alive) continue;
      if (
        aabb(
          bullet.x,
          bullet.y,
          C.PLAYER_BULLET_W,
          C.PLAYER_BULLET_H,
          b.x,
          b.y,
          C.BUG_W,
          C.BUG_H,
        )
      ) {
        b.alive = false;
        bullet.y = -100; // mark for culling
        s.score += C.ROW_POINTS[b.row] ?? 10;
        fx.explode = true;
        s.shake = Math.min(6, s.shake + 3);
        spawnParticles(s, b.x + C.BUG_W / 2, b.y + C.BUG_H / 2, C.COLORS.rows[b.row], 10);
        if (Math.random() < C.POWERUP_DROP_CHANCE) {
          s.powerUps.push({ x: b.x + C.BUG_W / 2, y: b.y + C.BUG_H / 2 });
        }
        break;
      }
    }
  }

  // --- Bullets vs shields (both directions) ---
  const hitShield = (
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ): boolean => {
    for (const cell of s.shields) {
      if (cell.hp <= 0) continue;
      if (aabb(bx, by, bw, bh, cell.x, cell.y, C.SHIELD_CELL, C.SHIELD_CELL)) {
        cell.hp -= 1;
        spawnParticles(s, cell.x + C.SHIELD_CELL / 2, cell.y + C.SHIELD_CELL / 2, C.COLORS.shield, 4);
        return true;
      }
    }
    return false;
  };
  for (const bullet of s.playerBullets) {
    if (bullet.y < -20) continue;
    if (hitShield(bullet.x, bullet.y, C.PLAYER_BULLET_W, C.PLAYER_BULLET_H)) {
      bullet.y = -100;
    }
  }
  for (const bullet of s.bugBullets) {
    if (bullet.y > C.HEIGHT + 20) continue;
    if (hitShield(bullet.x, bullet.y, C.BUG_BULLET_W, C.BUG_BULLET_H)) {
      bullet.y = C.HEIGHT + 100;
    }
  }

  // --- Bug bullets vs player ---
  if (p.invuln <= 0) {
    for (const bullet of s.bugBullets) {
      if (
        aabb(
          bullet.x,
          bullet.y,
          C.BUG_BULLET_W,
          C.BUG_BULLET_H,
          p.x - half,
          p.y,
          C.PLAYER_W,
          C.PLAYER_H,
        )
      ) {
        bullet.y = C.HEIGHT + 100;
        s.lives -= 1;
        fx.playerHit = true;
        p.invuln = C.PLAYER_INVULN;
        p.spreadTimer = 0;
        s.shake = 10;
        s.flash = 1;
        spawnParticles(s, p.x, p.y + C.PLAYER_H / 2, C.COLORS.player, 18);
        if (s.lives <= 0) {
          s.over = true;
          return fx;
        }
        break;
      }
    }
  }

  // --- Powerups vs player ---
  for (const pu of s.powerUps) {
    if (
      aabb(
        pu.x - C.POWERUP_SIZE / 2,
        pu.y - C.POWERUP_SIZE / 2,
        C.POWERUP_SIZE,
        C.POWERUP_SIZE,
        p.x - half,
        p.y,
        C.PLAYER_W,
        C.PLAYER_H,
      )
    ) {
      pu.y = C.HEIGHT + 100;
      p.spreadTimer = C.SPREAD_DURATION;
      fx.powerup = true;
      spawnParticles(s, p.x, p.y, C.COLORS.powerup, 14);
    }
  }

  // --- Cull dead entities ---
  s.playerBullets = s.playerBullets.filter((b) => b.y > -20 && b.y < C.HEIGHT + 20);
  s.bugBullets = s.bugBullets.filter((b) => b.y > -20 && b.y < C.HEIGHT + 20);
  s.powerUps = s.powerUps.filter((pu) => pu.y < C.HEIGHT + 20);
  s.particles = s.particles.filter((pt) => pt.life > 0);
  s.shields = s.shields.filter((c) => c.hp > 0);

  // --- Wave clear ---
  if (s.bugs.every((b) => !b.alive)) {
    fx.waveClear = true;
    nextWave(s);
  }

  return fx;
}
