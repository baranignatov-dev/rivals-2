import { drawShape } from './geometry.js';

const TAU = Math.PI * 2;

function zoneColor(kind) {
  switch (kind) {
    case 'heal':
      return { fill: 'rgba(34, 197, 94, 0.16)', edge: 'rgba(74, 222, 128, 0.7)' };
    case 'damage':
      return { fill: 'rgba(251, 146, 60, 0.16)', edge: 'rgba(251, 146, 60, 0.7)' };
    case 'lava':
      return { fill: 'rgba(239, 68, 68, 0.3)', edge: 'rgba(248, 113, 113, 0.9)' };
    case 'power':
      return { fill: 'rgba(168, 85, 247, 0.16)', edge: 'rgba(192, 132, 252, 0.75)' };
    default:
      return { fill: 'rgba(148, 163, 184, 0.08)', edge: 'rgba(148, 163, 184, 0.35)' };
  }
}

function drawGround(ctx, game, t) {
  const map = game.map;
  const p = map.palette;
  const g = ctx.createLinearGradient(0, 0, map.w, map.h);
  g.addColorStop(0, p.ground[0]);
  g.addColorStop(1, p.ground[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, map.w, map.h);

  // grid
  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= map.w; x += 100) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, map.h);
  }
  for (let y = 0; y <= map.h; y += 100) {
    ctx.moveTo(0, y);
    ctx.lineTo(map.w, y);
  }
  ctx.stroke();

  // arena border
  ctx.strokeStyle = p.coverEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, map.w - 4, map.h - 4);

  if (map.platforms) {
    // void below the platforms
    ctx.fillStyle = '#03040f';
    ctx.fillRect(0, 0, map.w, map.h);
    for (const pl of map.platforms) drawShape(ctx, pl, '#16204a', 'rgba(129, 140, 248, 0.55)');
    // faint energy pulse on bridges
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(t * 2) * 0.12;
    for (const pl of map.platforms) {
      if (pl.kind !== 'capsule') continue;
      ctx.strokeStyle = '#a5b4fc';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pl.x1, pl.y1);
      ctx.lineTo(pl.x2, pl.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // elevated landmarks
  for (const el of map.elevated || []) {
    ctx.beginPath();
    ctx.arc(el.x, el.y, el.r, 0, TAU);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 12]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // area zones
  for (const z of map.zones) {
    const col = zoneColor(z.kind);
    drawShape(ctx, z.shape, col.fill, col.edge);
  }
  for (const z of map.zones) {
    const c = { x: 0, y: 0 };
    if (z.shape.kind === 'circle') {
      c.x = z.shape.x;
      c.y = z.shape.y;
    } else {
      c.x = (z.shape.x1 + z.shape.x2) / 2;
      c.y = (z.shape.y1 + z.shape.y2) / 2;
    }
    if (z.label) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(z.label, c.x, c.y - (z.shape.kind === 'circle' ? z.shape.r : z.shape.r) - 10);
    }
  }
  for (const el of map.elevated || []) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(el.label, el.x, el.y - el.r - 12);
  }

  // teleporters
  for (const tp of map.teleports) {
    for (const node of [tp.a, tp.b]) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 26, 0, TAU);
      ctx.fillStyle = 'rgba(129, 140, 248, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(165, 180, 252, 0.85)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(node.x, node.y, 10 + Math.sin(t * 3) * 3, 0, TAU);
      ctx.fillStyle = 'rgba(199, 210, 254, 0.55)';
      ctx.fill();
    }
  }

  // covers
  for (const c of map.covers) drawShape(ctx, c, p.cover, p.coverEdge);
}

function drawBullet(ctx, b) {
  const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3.2);
  glow.addColorStop(0, b.color);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 3.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r * 0.6, 0, TAU);
  ctx.fill();
}

function drawHpBar(ctx, x, y, w, h, ratio, color) {
  ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * ratio), h - 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawFighter(ctx, game, f, t) {
  if (!f.alive) return;
  const isPlayer = f === game.player;
  const c = f.char;

  // team ring
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.radius + 6, 0, TAU);
  ctx.strokeStyle = isPlayer ? 'rgba(56, 189, 248, 0.9)' : 'rgba(248, 113, 113, 0.75)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // spawn shield
  if (f.invuln > 0) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius + 12, 0, TAU);
    ctx.strokeStyle = `rgba(226, 232, 240, ${0.25 + Math.sin(t * 12) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // body
  const grad = ctx.createRadialGradient(f.x - 6, f.y - 8, 4, f.x, f.y, f.radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.35, c.color);
  grad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.radius, 0, TAU);
  ctx.fillStyle = f.flash > 0 ? '#ffffff' : grad;
  ctx.fill();
  ctx.strokeStyle = f.flash > 0 ? '#ffffff' : c.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // weapon / aim
  const recoil = f.recoil || 0;
  const muzzle = f.radius + 12 + recoil * 5;
  ctx.strokeStyle = c.color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(f.x + Math.cos(f.aimAngle) * (f.radius - 4), f.y + Math.sin(f.aimAngle) * (f.radius - 4));
  ctx.lineTo(f.x + Math.cos(f.aimAngle) * muzzle, f.y + Math.sin(f.aimAngle) * muzzle);
  ctx.stroke();

  // buff aura
  if (f.buffs.shield > 0) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius + 9, 0, TAU);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  if (f.buffs.surge > 0) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius + 9 + Math.sin(t * 8) * 2, 0, TAU);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // name + hp
  ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = isPlayer ? '#bae6fd' : 'rgba(254, 226, 226, 0.9)';
  ctx.fillText(isPlayer ? 'YOU' : f.name, f.x, f.y - f.radius - 20);
  drawHpBar(ctx, f.x - 26, f.y - f.radius - 15, 52, 7, f.hp / f.maxHp, isPlayer ? '#22d3ee' : '#f87171');

  if (f.buffs.power > 0) {
    ctx.fillStyle = 'rgba(192, 132, 252, 0.95)';
    ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('POWER', f.x, f.y - f.radius - 30);
  }
}

function drawBoss(ctx, game, boss, t) {
  if (!boss.alive) return;
  const d = boss.data;
  // telegraph
  if (boss.bcast) {
    const p = 1 - boss.bcast.t / boss.bcast.total;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, (boss.bcast.radius || 120) * p, 0, TAU);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  // aura
  const aura = ctx.createRadialGradient(boss.x, boss.y, boss.radius * 0.5, boss.x, boss.y, boss.radius * 2.4);
  aura.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
  aura.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(boss.x, boss.y, boss.radius * 2.4, 0, TAU);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(boss.x, boss.y, boss.radius, 0, TAU);
  const g = ctx.createRadialGradient(boss.x - 10, boss.y - 12, 6, boss.x, boss.y, boss.radius);
  g.addColorStop(0, '#fff1f2');
  g.addColorStop(0.5, d.color);
  g.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = boss.flash > 0 ? '#ffffff' : g;
  ctx.fill();
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = '600 30px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(d.emoji, boss.x, boss.y + 2);
  ctx.textBaseline = 'alphabetic';

  ctx.font = '700 15px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = '#fecaca';
  ctx.fillText(d.name.toUpperCase(), boss.x, boss.y - boss.radius - 24);
  drawHpBar(ctx, boss.x - 70, boss.y - boss.radius - 18, 140, 9, boss.hp / boss.maxHp, '#ef4444');
}

export function render(game, t = performance.now() / 1000) {
  const canvas = game.canvas;
  const ctx = game.ctx;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const v = game.computeView();
  const w = Math.max(1, Math.round(v.w * dpr));
  const h = Math.max(1, Math.round(v.h * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, v.w, v.h);
  if (!game.map) return;

  ctx.fillStyle = '#03040f';
  ctx.fillRect(0, 0, v.w, v.h);

  ctx.save();
  ctx.translate(v.w / 2, v.h / 2);
  ctx.scale(v.scale, v.scale);
  ctx.translate(-v.cx, -v.cy);

  drawGround(ctx, game, t);

  // bullets
  for (const b of game.bullets) drawBullet(ctx, b);

  // fighters sorted so the player draws on top
  const fighters = game.entities.filter((e) => e.kind === 'fighter');
  for (const f of fighters) if (!f.alive) {
    // death marker
    ctx.beginPath();
    ctx.arc(f.x, f.y, 14, 0, TAU);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.max(0, Math.ceil(f.respawn))}s`, f.x, f.y + 4);
  }
  for (const f of fighters) if (f !== game.player) drawFighter(ctx, game, f, t);
  drawFighter(ctx, game, game.player, t);
  if (game.boss) drawBoss(ctx, game, game.boss, t);

  // particles
  for (const p of game.particles) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * a, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // expanding rings
  for (const e of game.effects) {
    const k = 1 - e.life / e.maxLife;
    ctx.globalAlpha = Math.max(0, 1 - k);
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + (e.maxR - e.r) * k, 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // floating damage text
  for (const tx of game.texts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, tx.life / tx.maxLife));
    ctx.font = `700 ${tx.size}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = tx.color;
    ctx.fillText(tx.text, tx.x, tx.y);
  }
  ctx.globalAlpha = 1;

  // aim reticle
  if (game.player && game.player.alive) {
    const m = game.input;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.aimX, m.aimY, 12, 0, TAU);
    ctx.moveTo(m.aimX - 18, m.aimY);
    ctx.lineTo(m.aimX - 6, m.aimY);
    ctx.moveTo(m.aimX + 6, m.aimY);
    ctx.lineTo(m.aimX + 18, m.aimY);
    ctx.moveTo(m.aimX, m.aimY - 18);
    ctx.lineTo(m.aimX, m.aimY - 6);
    ctx.moveTo(m.aimX, m.aimY + 6);
    ctx.lineTo(m.aimX, m.aimY + 18);
    ctx.stroke();
  }

  ctx.restore();

  // vignette
  const vig = ctx.createRadialGradient(v.w / 2, v.h / 2, Math.min(v.w, v.h) * 0.35, v.w / 2, v.h / 2, Math.max(v.w, v.h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, v.w, v.h);

  drawMinimap(game, v);
}

export function drawMinimap(game, v) {
  const canvas = game.minimap;
  if (!canvas || !game.map) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = 176;
  const h = 120;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const sx = w / game.map.w;
  const sy = h / game.map.h;
  const scale = Math.min(sx, sy);
  const ox = (w - game.map.w * scale) / 2;
  const oy = (h - game.map.h * scale) / 2;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.fillRect(0, 0, game.map.w, game.map.h);
  if (game.map.platforms) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
    ctx.fillRect(0, 0, game.map.w, game.map.h);
    for (const pl of game.map.platforms) {
      if (pl.kind === 'circle') {
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.r, 0, TAU);
        ctx.fillStyle = 'rgba(49, 46, 129, 0.65)';
        ctx.fill();
      }
    }
  }
  for (const z of game.map.zones) {
    if (z.kind === 'lava') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.55)';
    } else if (z.kind === 'heal') {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
    } else if (z.kind === 'damage') {
      ctx.fillStyle = 'rgba(251, 146, 60, 0.45)';
    } else if (z.kind === 'power') {
      ctx.fillStyle = 'rgba(192, 132, 252, 0.45)';
    } else continue;
    if (z.shape.kind === 'circle') {
      ctx.beginPath();
      ctx.arc(z.shape.x, z.shape.y, z.shape.r, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  for (const c of game.map.covers) {
    if (c.kind === 'circle') {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, TAU);
      ctx.fill();
    }
  }

  for (const f of game.entities) {
    if (!f.alive) continue;
    if (f.kind === 'boss') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 62, 0, TAU);
      ctx.fill();
      continue;
    }
    ctx.fillStyle = f === game.player ? '#38bdf8' : '#f87171';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f === game.player ? 46 : 38, 0, TAU);
    ctx.fill();
  }

  // viewport box
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.lineWidth = 8;
  ctx.strokeRect(v.cx - v.vw / 2, v.cy - v.vh / 2, v.vw, v.vh);

  ctx.restore();
}
