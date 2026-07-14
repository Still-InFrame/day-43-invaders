import * as C from "./constants";
import type { GameState } from "./types";

// Static starfield, generated once (deterministic so it doesn't twinkle-jump).
const STARS = Array.from({ length: 60 }, (_, i) => {
  // Cheap hash for stable pseudo-random positions.
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: r(1) * C.WIDTH, y: r(2) * (C.HEIGHT - 120), s: r(3) * 1.6 + 0.4, t: r(4) };
});

function drawBackground(ctx: CanvasRenderingContext2D, time: number) {
  const g = ctx.createLinearGradient(0, 0, 0, C.HEIGHT);
  g.addColorStop(0, C.COLORS.bg0);
  g.addColorStop(1, C.COLORS.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);

  // Twinkling stars.
  for (const st of STARS) {
    const tw = 0.5 + 0.5 * Math.sin(time * 2 + st.t * 6.28);
    ctx.globalAlpha = 0.3 + tw * 0.5;
    ctx.fillStyle = "#cfc6ff";
    ctx.fillRect(st.x, st.y, st.s, st.s);
  }
  ctx.globalAlpha = 1;

  // Perspective grid floor.
  const horizon = C.HEIGHT - 90;
  ctx.strokeStyle = C.COLORS.grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  ctx.shadowColor = C.COLORS.grid;
  ctx.shadowBlur = 8;
  // Vertical converging lines.
  for (let i = -6; i <= 6; i++) {
    const vx = C.WIDTH / 2 + i * 22;
    ctx.beginPath();
    ctx.moveTo(C.WIDTH / 2 + i * 90, C.HEIGHT);
    ctx.lineTo(vx, horizon);
    ctx.stroke();
  }
  // Horizontal receding lines that scroll toward the viewer.
  for (let i = 0; i < 10; i++) {
    const p = (i + (time * 0.35) % 1) / 10;
    const y = horizon + p * p * (C.HEIGHT - horizon);
    ctx.globalAlpha = 0.3 * (1 - p) + 0.05;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(C.WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawBug(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  wiggle: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  const w = C.BUG_W;
  const h = C.BUG_H;
  // Body.
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2.6, h / 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Legs (wiggle between two frames).
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 6;
  const legOff = wiggle ? 3 : -3;
  for (const sx of [-1, 1]) {
    for (let l = 0; l < 3; l++) {
      const bx = w / 2 + sx * (w / 5);
      const by = h / 2 + (l - 1) * 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + sx * 7, by + legOff);
      ctx.stroke();
    }
  }
  // Antennae.
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(w / 2 + sx * 3, h / 2 - h / 3);
    ctx.lineTo(w / 2 + sx * 7, -2);
    ctx.stroke();
  }
  // Eyes.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0b0420";
  ctx.beginPath();
  ctx.arc(w / 2 - 4, h / 2 - 1, 2, 0, Math.PI * 2);
  ctx.arc(w / 2 + 4, h / 2 - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  const p = s.player;
  // Blink while invulnerable.
  if (p.invuln > 0 && Math.floor(time * 12) % 2 === 0) return;
  const spread = p.spreadTimer > 0;
  const color = spread ? C.COLORS.powerup : C.COLORS.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  const hw = C.PLAYER_W / 2;
  ctx.beginPath();
  ctx.moveTo(-hw, C.PLAYER_H); // base left
  ctx.lineTo(hw, C.PLAYER_H); // base right
  ctx.lineTo(hw - 6, 4); // hull right
  ctx.lineTo(6, 4); // turret base right
  ctx.lineTo(0, -8); // cannon tip
  ctx.lineTo(-6, 4); // turret base left
  ctx.lineTo(-hw + 6, 4); // hull left
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function render(ctx: CanvasRenderingContext2D, s: GameState, time: number) {
  ctx.save();
  if (s.shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * s.shake,
      (Math.random() - 0.5) * s.shake,
    );
  }

  drawBackground(ctx, time);

  // Shields.
  ctx.shadowColor = C.COLORS.shield;
  for (const cell of s.shields) {
    ctx.globalAlpha = cell.hp >= C.SHIELD_CELL_HP ? 1 : 0.55;
    ctx.fillStyle = C.COLORS.shield;
    ctx.shadowBlur = 6;
    ctx.fillRect(cell.x, cell.y, C.SHIELD_CELL - 1, C.SHIELD_CELL - 1);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Bugs.
  const wiggle = Math.floor(time * 4) % 2 === 0;
  for (const b of s.bugs) {
    if (!b.alive) continue;
    drawBug(ctx, b.x, b.y, C.COLORS.rows[b.row], wiggle);
  }

  // Player bullets.
  ctx.fillStyle = C.COLORS.bullet;
  ctx.shadowColor = C.COLORS.bullet;
  ctx.shadowBlur = 10;
  for (const bl of s.playerBullets) {
    ctx.fillRect(bl.x, bl.y, C.PLAYER_BULLET_W, C.PLAYER_BULLET_H);
  }
  // Bug bullets.
  ctx.fillStyle = C.COLORS.bugBullet;
  ctx.shadowColor = C.COLORS.bugBullet;
  for (const bl of s.bugBullets) {
    ctx.fillRect(bl.x, bl.y, C.BUG_BULLET_W, C.BUG_BULLET_H);
  }
  ctx.shadowBlur = 0;

  // Power-ups (pulsing diamond).
  for (const pu of s.powerUps) {
    const pulse = 1 + 0.15 * Math.sin(time * 8);
    ctx.save();
    ctx.translate(pu.x, pu.y);
    ctx.rotate(Math.PI / 4);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = C.COLORS.powerup;
    ctx.shadowColor = C.COLORS.powerup;
    ctx.shadowBlur = 14;
    const q = C.POWERUP_SIZE / 2;
    ctx.fillRect(-q, -q, C.POWERUP_SIZE, C.POWERUP_SIZE);
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  // Particles.
  for (const pt of s.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
  }
  ctx.globalAlpha = 1;

  drawPlayer(ctx, s, time);

  // White flash on hit.
  if (s.flash > 0) {
    ctx.globalAlpha = s.flash * 0.4;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  drawHud(ctx, s);
}

function drawHud(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.fillStyle = C.COLORS.text;
  ctx.shadowColor = C.COLORS.player;
  ctx.shadowBlur = 6;
  ctx.font = "bold 16px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE ${s.score}`, 12, 24);
  ctx.textAlign = "center";
  ctx.fillText(`WAVE ${s.wave}`, C.WIDTH / 2, 24);
  ctx.shadowBlur = 0;

  // Lives as little ships.
  ctx.textAlign = "right";
  for (let i = 0; i < s.lives; i++) {
    const x = C.WIDTH - 14 - i * 20;
    ctx.fillStyle = C.COLORS.player;
    ctx.shadowColor = C.COLORS.player;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x - 7, 24);
    ctx.lineTo(x + 7, 24);
    ctx.lineTo(x, 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Spread-shot timer bar.
  if (s.player.spreadTimer > 0) {
    const w = 90;
    const frac = s.player.spreadTimer / C.SPREAD_DURATION;
    ctx.fillStyle = "rgba(255,202,58,0.25)";
    ctx.fillRect(C.WIDTH / 2 - w / 2, 32, w, 5);
    ctx.fillStyle = C.COLORS.powerup;
    ctx.fillRect(C.WIDTH / 2 - w / 2, 32, w * frac, 5);
  }
}
