import { CHARACTERS, BOT_NAMES } from '../data/characters.js';
import { MAPS } from '../data/maps.js';
import { MODES } from '../data/modes.js';
import { BOSSES } from '../data/bosses.js';
import { clamp, resolveAgainstShape, shapeContains } from './geometry.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const norm = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

export class Game {
  constructor(canvas, emit = () => {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.emit = emit;
    this.state = 'idle';
    this.keys = new Set();
    this.input = { moveX: 0, moveY: 0, aimX: 0, aimY: 0, firing: false };
    this.idSeq = 0;
    this.view = { w: 800, h: 600, scale: 1, vw: 1500, vh: 1000, cx: 1100, cy: 750 };
  }

  // ---------------------------------------------------------------- lifecycle

  start({ mapKey, modeKey, charKey }) {
    this.map = MAPS[mapKey];
    this.mode = MODES[modeKey];
    this.entities = [];
    this.bullets = [];
    this.particles = [];
    this.effects = [];
    this.texts = [];
    this.feed = [];
    this.boss = null;
    this.bossDefeated = false;
    this.bossTimer = 35;
    this.elapsed = 0;
    this.timeLeft = this.mode.duration;
    this.killTarget = this.mode.kills;
    this.banner = { text: 'FIGHT!', sub: `${this.map.name} · ${this.mode.label}`, t: 2.2 };
    this.result = null;
    this.state = 'playing';
    this.paused = false;

    this.player = this.makeFighter(charKey, 0, this.spawnPoint(), false, 'You');
    this.bots = [];
    const names = [...BOT_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < this.mode.bots; i++) {
      const key = Object.keys(CHARACTERS)[Math.floor(Math.random() * 4)];
      const bot = this.makeFighter(key, 1, this.spawnPoint(this.player), true, names[i % names.length]);
      this.bots.push(bot);
    }
    this.entities = [this.player, ...this.bots];
    this.camFocus = { x: this.player.x, y: this.player.y };
    this.emit('start', { map: this.map, mode: this.mode });
  }

  makeFighter(charKey, team, pos, isBot, name) {
    const c = CHARACTERS[charKey];
    return {
      id: ++this.idSeq,
      kind: 'fighter',
      charKey,
      char: c,
      team,
      name,
      isBot,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      angle: rnd(-Math.PI, Math.PI),
      aimAngle: 0,
      radius: 19,
      hp: c.maxHp,
      maxHp: c.maxHp,
      alive: true,
      respawn: 0,
      invuln: 1.2,
      atkCd: 0,
      abilityCd: 0,
      buffs: { shield: 0, surge: 0, power: 0 },
      kills: 0,
      deaths: 0,
      bestStreak: 0,
      streak: 0,
      flash: 0,
      recoil: 0,
      think: 0,
      strafe: Math.random() < 0.5 ? 1 : -1,
      falling: false,
    };
  }

  spawnPoint(awayFrom) {
    const spawns = this.map.spawns;
    if (!awayFrom) return { ...spawns[Math.floor(Math.random() * spawns.length)] };
    let best = spawns[0];
    let bestD = -1;
    for (let i = 0; i < 6; i++) {
      const s = spawns[Math.floor(Math.random() * spawns.length)];
      const d = dist(s, awayFrom);
      if (d > bestD) {
        bestD = d;
        best = s;
      }
    }
    return { x: best.x + rnd(-40, 40), y: best.y + rnd(-40, 40) };
  }

  // ------------------------------------------------------------------ derived

  fighters() {
    return this.entities.filter((e) => e.kind === 'fighter');
  }

  aliveFighters() {
    return this.entities.filter((e) => e.alive && e.kind === 'fighter');
  }

  damageOf(e) {
    let m = 1;
    if (e.buffs.surge > 0) m *= 1.5;
    if (e.buffs.power > 0) m *= 1.3;
    return e.char.damage * m;
  }

  speedOf(e) {
    let m = 1;
    if (e.buffs.surge > 0) m *= 1.5;
    if (e.buffs.power > 0) m *= 1.12;
    return e.char.speed * m;
  }

  armorOf(e) {
    let a = e.char.armor || 0;
    if (e.buffs.shield > 0) a += 0.5;
    return Math.min(a, 0.75);
  }

  rangeOf(e) {
    return e.char.proj.speed * e.char.proj.life;
  }

  nearestEnemy(e) {
    let best = null;
    let bestD = Infinity;
    for (const o of this.aliveFighters()) {
      if (o === e) continue;
      if (e.kind === 'fighter' && o.team === e.team) continue;
      const d = dist(o, e);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  // --------------------------------------------------------------------- loop

  update(dt) {
    if (this.state !== 'playing' || this.paused) return;
    dt = Math.min(dt, 1 / 30);
    this.elapsed += dt;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }

    this.bossTimer -= dt;
    if (!this.boss && !this.bossDefeated && this.bossTimer <= 0) this.spawnBoss();

    this.updatePlayer(dt);
    for (const b of this.bots) this.updateBot(b, dt);
    if (this.boss) this.updateBoss(this.boss, dt);

    this.updateBullets(dt);
    this.updateEffects(dt);

    for (const f of this.aliveFighters()) {
      f.atkCd = Math.max(0, f.atkCd - dt);
      f.abilityCd = Math.max(0, f.abilityCd - dt);
      f.invuln = Math.max(0, f.invuln - dt);
      f.flash = Math.max(0, f.flash - dt);
      f.recoil = Math.max(0, f.recoil - dt * 4);
      for (const k of Object.keys(f.buffs)) f.buffs[k] = Math.max(0, f.buffs[k] - dt);
      this.applyZones(f, dt);
    }
    for (const f of this.fighters()) {
      if (!f.alive) {
        f.respawn -= dt;
        if (f.respawn <= 0 && this.state === 'playing') this.respawn(f);
      }
    }

    this.camFocus = this.player.alive
      ? { x: this.player.x, y: this.player.y }
      : this.player.deathPos || this.camFocus;

    this.checkEnd();
  }

  updatePlayer(dt) {
    const p = this.player;
    if (!p.alive) return;
    const ax = this.input.moveX;
    const ay = this.input.moveY;
    const aimAngle = Math.atan2(this.input.aimY - p.y, this.input.aimX - p.x);
    p.aimAngle = aimAngle;
    p.angle = aimAngle;
    this.moveFighter(p, ax, ay, dt);
    if (this.input.firing) this.tryFire(p, aimAngle);
  }

  updateBot(b, dt) {
    if (!b.alive) return;
    const target = this.nearestEnemy(b);
    if (!target) return;
    const d = dist(target, b);
    const ang = Math.atan2(target.y - b.y, target.x - b.x);
    b.aimAngle = ang;
    b.angle = ang;
    if (b.think <= 0) {
      b.think = rnd(0.5, 1.3);
      b.strafe = Math.random() < 0.5 ? 1 : -1;
    }
    b.think -= dt;

    const pref = b.charKey === 'titan' ? 70 : b.charKey === 'nova' ? 400 : 210;
    let ax = 0;
    let ay = 0;
    if (d > pref + 50) {
      ax += Math.cos(ang);
      ay += Math.sin(ang);
    } else if (d < pref - 60) {
      ax -= Math.cos(ang);
      ay -= Math.sin(ang);
    }
    ax += Math.cos(ang + Math.PI / 2) * b.strafe * 0.9;
    ay += Math.sin(ang + Math.PI / 2) * b.strafe * 0.9;

    // steer away from hazards
    const look = { x: b.x + norm(ax, ay).x * 90, y: b.y + norm(ax, ay).y * 90 };
    if (this.hazardAt(look.x, look.y, b)) {
      const t = norm(Math.cos(ang + Math.PI / 2) * b.strafe, Math.sin(ang + Math.PI / 2) * b.strafe);
      ax = -t.x + Math.cos(ang) * 0.3;
      ay = -t.y + Math.sin(ang) * 0.3;
    }

    this.moveFighter(b, ax, ay, dt);

    const jitter = rnd(-0.09, 0.09);
    if (b.atkCd <= 0 && d < this.rangeOf(b) * 0.92) {
      this.tryFire(b, ang + jitter);
    }
    if (b.abilityCd <= 0) {
      const close = d < 320;
      if ((close && Math.random() < 1.6 * dt) || Math.random() < 0.25 * dt) {
        this.castAbility(b, target, { x: target.x, y: target.y });
      }
    }
  }

  updateBoss(boss, dt) {
    if (!boss.alive) return;
    const target = this.nearestEnemy(boss);
    const ang = target ? Math.atan2(target.y - boss.y, target.x - boss.x) : 0;
    boss.angle = ang;
    boss.aimAngle = ang;
    if (target) {
      const d = dist(target, boss);
      if (d > boss.data.radius + 60) this.moveFighter(boss, Math.cos(ang), Math.sin(ang), dt * 0.85);
    }
    boss.atkCd = Math.max(0, boss.atkCd - dt);

    // telegraphed attacks
    if (boss.bcast) {
      boss.bcast.t -= dt;
      if (boss.bcast.t <= 0) {
        this.resolveBossCast(boss, boss.bcast);
        boss.bcast = null;
      }
    } else {
      for (const ab of boss.data.abilities) {
        boss.cds[ab.key] = (boss.cds[ab.key] || 0) - dt;
      }
      const ready = boss.data.abilities.find((ab) => (boss.cds[ab.key] || 0) <= 0);
      if (ready) {
        boss.cds[ready.key] = ready.cd;
        boss.bcast = {
          key: ready.key,
          name: ready.name,
          radius: ready.radius || 0,
          x: target ? target.x : boss.x,
          y: target ? target.y : boss.y,
          t: ready.key === 'shards' || ready.key === 'meteor' ? 0.6 : 1.0,
          total: ready.key === 'shards' || ready.key === 'meteor' ? 0.6 : 1.0,
        };
      }
    }
  }

  resolveBossCast(boss, cast) {
    const dmg = boss.data.damage;
    if (cast.key === 'shards' || cast.key === 'meteor') {
      const count = cast.key === 'shards' ? 9 : 5;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + rnd(-0.15, 0.15);
        this.bullets.push({
          x: boss.x + Math.cos(a) * boss.radius,
          y: boss.y + Math.sin(a) * boss.radius,
          vx: Math.cos(a) * (cast.key === 'shards' ? 380 : 320),
          vy: Math.sin(a) * (cast.key === 'shards' ? 380 : 320),
          r: cast.key === 'shards' ? 9 : 13,
          dmg: dmg * 0.45,
          team: 2,
          owner: boss,
          color: cast.key === 'shards' ? '#7dd3fc' : '#fb923c',
          life: 1.6,
          maxLife: 1.6,
          splash: 0,
        });
      }
      this.ring(boss.x, boss.y, 40, 200, 0.4, boss.data.color);
      return;
    }
    const r = cast.radius;
    this.ring(boss.x, boss.y, 20, r, 0.45, boss.data.color);
    for (const f of this.aliveFighters()) {
      if (dist(f, boss) < r + f.radius * 0.5) this.applyDamage(f, dmg, boss);
    }
  }

  spawnBoss() {
    const data = BOSSES[this.map.boss];
    const pos = this.map.bossSpawn;
    this.boss = {
      id: ++this.idSeq,
      kind: 'boss',
      data,
      name: data.name,
      team: 2,
      isBot: true,
      x: pos.x,
      y: pos.y,
      radius: data.radius,
      hp: data.maxHp,
      maxHp: data.maxHp,
      alive: true,
      angle: 0,
      aimAngle: 0,
      atkCd: 0,
      invuln: 0,
      buffs: { shield: 0, surge: 0, power: 0 },
      kills: 0,
      deaths: 0,
      flash: 0,
      cds: {},
      bcast: null,
      respawn: 0,
      char: { speed: data.speed, damage: data.damage, maxHp: data.maxHp, proj: {} },
    };
    this.entities.push(this.boss);
    this.banner = { text: 'BOSS INCOMING', sub: `${data.emoji} ${data.name} has entered the arena`, t: 2.6 };
    this.ring(pos.x, pos.y, 30, 320, 0.8, data.color);
    this.emit('boss', { name: data.name });
  }

  // ------------------------------------------------------------------ physics

  moveFighter(e, ax, ay, dt) {
    const speed = this.speedOf(e);
    const n = norm(ax, ay);
    const moving = Math.hypot(ax, ay) > 0.05;
    e.vx = moving ? n.x * speed : 0;
    e.vy = moving ? n.y * speed : 0;
    e.x += e.vx * dt;
    e.y += e.vy * dt;

    e.x = clamp(e.x, e.radius, this.map.w - e.radius);
    e.y = clamp(e.y, e.radius, this.map.h - e.radius);

    for (const c of this.map.covers) resolveAgainstShape(e, c);

    // keep bodies from stacking
    for (const o of this.entities) {
      if (o === e || !o.alive) continue;
      const d = dist(o, e);
      const min = o.radius + e.radius;
      if (d > 0.001 && d < min) {
        const push = (min - d) / 2;
        const nx = (e.x - o.x) / d;
        const ny = (e.y - o.y) / d;
        e.x += nx * push;
        e.y += ny * push;
        if (o.kind === 'fighter') {
          o.x -= nx * push;
          o.y -= ny * push;
        }
      }
    }

    if (this.map.platforms && e.kind === 'fighter') {
      const onGround = this.map.platforms.some((p) => shapeContains(p, e.x, e.y));
      if (!onGround) this.fall(e);
    }
  }

  hazardAt(x, y, ignore) {
    for (const z of this.map.zones) {
      if (z.kind !== 'lava' && z.kind !== 'damage') continue;
      if (shapeContains(z.shape, x, y)) return true;
    }
    if (this.map.platforms && ignore?.kind === 'fighter') {
      return !this.map.platforms.some((p) => shapeContains(p, x, y));
    }
    return false;
  }

  fall(e) {
    if (!e.alive || e.invuln > 0) return;
    e.deathPos = { x: e.x, y: e.y };
    this.kill(e, null, 'void');
  }

  applyZones(e, dt) {
    for (const z of this.map.zones) {
      if (!shapeContains(z.shape, e.x, e.y)) continue;
      if (z.kind === 'heal') {
        e.hp = Math.min(e.maxHp, e.hp + (z.rate || 10) * dt);
      } else if (z.kind === 'damage') {
        this.applyDamage(e, (z.rate || 20) * dt, null, true);
      } else if (z.kind === 'lava') {
        this.kill(e, null, 'lava');
        return;
      } else if (z.kind === 'power') {
        e.buffs.power = Math.max(e.buffs.power, 0.5);
      }
    }
  }

  // ------------------------------------------------------------------- combat

  tryFire(e, angle) {
    if (!e.alive || e.atkCd > 0) return;
    const c = e.char;
    e.atkCd = c.attackCd;
    e.recoil = 1;
    const px = e.x + Math.cos(angle) * (e.radius + 6);
    const py = e.y + Math.sin(angle) * (e.radius + 6);
    this.bullets.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * c.proj.speed,
      vy: Math.sin(angle) * c.proj.speed,
      r: c.proj.radius,
      dmg: this.damageOf(e),
      team: e.team,
      owner: e,
      color: c.proj.color,
      life: c.proj.life,
      maxLife: c.proj.life,
      splash: c.proj.splash || 0,
    });
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * rnd(60, 240) + rnd(-60, 60),
        vy: Math.sin(angle) * rnd(60, 240) + rnd(-60, 60),
        life: 0.22,
        maxLife: 0.22,
        color: c.proj.color,
        size: rnd(2, 4),
      });
    }
  }

  updateBullets(dt) {
    const keep = [];
    for (const b of this.bullets) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0) {
        this.impact(b, null);
        continue;
      }
      if (b.x < -50 || b.y < -50 || b.x > this.map.w + 50 || b.y > this.map.h + 50) continue;
      let blocked = false;
      for (const c of this.map.covers) {
        if (shapeContains(c, b.x, b.y)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        this.impact(b, null);
        continue;
      }
      let hit = null;
      for (const t of this.entities) {
        if (!t.alive || t === b.owner) continue;
        if (t.kind === 'fighter' && t.team === b.team) continue;
        if (t.kind === 'boss' && b.team === 2) continue;
        if (dist(t, b) < t.radius + b.r) {
          hit = t;
          break;
        }
      }
      if (hit) {
        this.impact(b, hit);
        continue;
      }
      keep.push(b);
    }
    this.bullets = keep;
  }

  impact(bullet, target) {
    for (let i = 0; i < 7; i++) {
      this.particles.push({
        x: bullet.x,
        y: bullet.y,
        vx: rnd(-180, 180),
        vy: rnd(-180, 180),
        life: 0.32,
        maxLife: 0.32,
        color: bullet.color,
        size: rnd(1.5, 3.5),
      });
    }
    if (target) this.applyDamage(target, bullet.dmg, bullet.owner);
    if (bullet.splash > 0) {
      this.ring(bullet.x, bullet.y, 8, bullet.splash, 0.34, bullet.color);
      for (const t of this.entities) {
        if (!t.alive || t === target || t === bullet.owner) continue;
        if (t.kind === 'fighter' && t.team === bullet.team) continue;
        if (dist(t, bullet) < bullet.splash + t.radius * 0.5) {
          this.applyDamage(t, bullet.dmg * 0.5, bullet.owner);
        }
      }
    }
  }

  applyDamage(target, amount, source, silent = false) {
    if (!target.alive) return;
    if (target.invuln > 0 && !silent) return;
    const mitigated = amount * (1 - (target.kind === 'boss' ? 0 : this.armorOf(target)));
    target.hp -= mitigated;
    if (!silent) target.flash = 0.16;
    if (source && source.kind !== 'boss' && source.kind !== 'fighter') source = null;
    if (!silent) {
      this.texts.push({
        x: target.x + rnd(-8, 8),
        y: target.y - target.radius - 10,
        text: Math.round(mitigated).toString(),
        color: source === this.player ? '#fde047' : '#fca5a5',
        life: 0.7,
        maxLife: 0.7,
        size: 15,
      });
    }
    if (target.hp <= 0) this.kill(target, source, null);
  }

  kill(target, source, cause) {
    if (!target.alive) return;
    target.alive = false;
    target.hp = 0;
    target.deathPos = { x: target.x, y: target.y };
    for (let i = 0; i < 26; i++) {
      const a = rnd(0, TAU);
      this.particles.push({
        x: target.x,
        y: target.y,
        vx: Math.cos(a) * rnd(40, 340),
        vy: Math.sin(a) * rnd(40, 340),
        life: rnd(0.3, 0.9),
        maxLife: 0.9,
        color: target.kind === 'boss' ? target.data.color : target.char.color,
        size: rnd(2, 5),
      });
    }
    this.ring(target.x, target.y, 10, target.radius * 3, 0.5, '#ffffff');

    if (target.kind === 'boss') {
      this.bossDefeated = true;
      const r = target.data.reward;
      this.banner = { text: 'BOSS DEFEATED', sub: `+${r.coins} coins · +${r.xp} XP`, t: 3 };
      this.feed.push({ text: `${target.data.emoji} ${target.data.name} was slain by ${source ? source.name : 'the arena'}`, t: 6 });
      this.emit('bossDown', { name: target.data.name, reward: r });
      return;
    }

    target.respawn = target === this.player ? 3 : rnd(2.4, 4);
    target.deaths++;
    target.streak = 0;
    target.buffs.shield = 0;
    target.buffs.surge = 0;
    target.buffs.power = 0;

    if (source && source.kind === 'fighter') {
      source.kills++;
      source.streak++;
      source.bestStreak = Math.max(source.bestStreak, source.streak);
      const label = source === this.player ? 'You' : source.name;
      this.feed.push({ text: `${label} eliminated ${target === this.player ? 'You' : target.name}`, t: 5 });
      if (source.streak >= 5 && source.streak % 5 === 0) {
        this.texts.push({
          x: source.x,
          y: source.y - 60,
          text: `${source.streak} KILL STREAK`,
          color: '#fbbf24',
          life: 1.4,
          maxLife: 1.4,
          size: 18,
        });
      }
    } else {
      const causes = { lava: 'lava', void: 'the void', damage: 'the terrain' };
      this.feed.push({ text: `${target.name} was lost to ${causes[cause] || 'the arena'}`, t: 5 });
    }
    if (target === this.player) this.emit('playerDown');
  }

  respawn(f) {
    const pos = this.spawnPoint(this.nearestEnemy(f));
    f.x = pos.x;
    f.y = pos.y;
    f.hp = f.maxHp;
    f.alive = true;
    f.invuln = 1.4;
    f.buffs = { shield: 0, surge: 0, power: 0 };
    f.abilityCd = 0;
    f.atkCd = 0;
    this.ring(f.x, f.y, 8, 70, 0.4, f.char.color);
  }

  // ------------------------------------------------------------------ abilities

  castAbility(e, target, aimPoint) {
    if (!e.alive || e.abilityCd > 0 || e.kind === 'boss') return;
    const ab = e.char.ability;
    switch (e.charKey) {
      case 'blade': {
        const t = this.nearestEnemy(e);
        if (t && dist(t, e) < 800) {
          const a = t.aimAngle + Math.PI;
          const nx = clamp(t.x + Math.cos(a) * 70, 40, this.map.w - 40);
          const ny = clamp(t.y + Math.sin(a) * 70, 40, this.map.h - 40);
          this.ring(e.x, e.y, 6, 90, 0.35, e.char.color);
          e.x = nx;
          e.y = ny;
          e.aimAngle = Math.atan2(t.y - e.y, t.x - e.x);
          e.angle = e.aimAngle;
          this.applyDamage(t, 60, e);
          this.ring(e.x, e.y, 10, 110, 0.3, '#bbf7d0');
        } else {
          const a = e.aimAngle;
          e.x = clamp(e.x + Math.cos(a) * 220, 40, this.map.w - 40);
          e.y = clamp(e.y + Math.sin(a) * 220, 40, this.map.h - 40);
          this.ring(e.x, e.y, 6, 90, 0.3, e.char.color);
        }
        break;
      }
      case 'nova': {
        const point = aimPoint || { x: target ? target.x : e.x, y: target ? target.y : e.y };
        this.ring(point.x, point.y, 12, 190, 0.5, '#c4b5fd');
        for (const f of this.aliveFighters()) {
          if (f.team === e.team) continue;
          if (Math.hypot(f.x - point.x, f.y - point.y) < 190 + f.radius * 0.5) {
            this.applyDamage(f, 55, e);
          }
        }
        break;
      }
      case 'titan': {
        e.buffs.shield = 5;
        this.ring(e.x, e.y, 10, 80, 0.45, '#fde68a');
        break;
      }
      case 'omega': {
        e.buffs.surge = 6;
        this.ring(e.x, e.y, 10, 95, 0.5, '#7dd3fc');
        break;
      }
      default:
        break;
    }
    e.abilityCd = ab.cd;
  }

  // -------------------------------------------------------------------- fx

  ring(x, y, r, maxR, life, color) {
    this.effects.push({ x, y, r, maxR, life, maxLife: life, color });
  }

  updateEffects(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const e of this.effects) e.life -= dt;
    this.effects = this.effects.filter((e) => e.life > 0);

    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 30 * dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);

    for (const f of this.feed) f.t -= dt;
    this.feed = this.feed.filter((f) => f.t > 0).slice(-4);
  }

  // -------------------------------------------------------------------- score

  leadingBot() {
    let best = null;
    for (const b of this.bots) if (!best || b.kills > best.kills) best = b;
    return best;
  }

  checkEnd() {
    const playerKills = this.player.kills;
    const lead = this.leadingBot();
    const leadKills = lead ? lead.kills : 0;
    if (playerKills >= this.killTarget) return this.finish(true);
    if (leadKills >= this.killTarget) return this.finish(false);
    if (this.timeLeft <= 0) return this.finish(playerKills >= leadKills);
  }

  finish(win) {
    if (this.state === 'over') return;
    this.state = 'over';
    const kills = this.player.kills;
    const streakBonus = this.player.bestStreak >= 5 ? 25 * Math.floor(this.player.bestStreak / 5) : 0;
    const rewards = {
      coins: kills * 50 + (win ? 500 : 0) + (this.bossDefeated ? 500 : 0) + streakBonus,
      xp: kills * 25 + (win ? 250 : 0) + (this.bossDefeated ? 500 : 0),
    };
    this.result = {
      win,
      kills,
      deaths: this.player.deaths,
      bestStreak: this.player.bestStreak,
      bossDefeated: this.bossDefeated,
      killTarget: this.killTarget,
      mode: this.mode,
      map: this.map,
      char: this.player.char,
      timeLeft: this.timeLeft,
      rewards,
      boards: [...this.fighters()]
        .map((f) => ({ name: f.name, kills: f.kills, deaths: f.deaths, char: f.char.name, isPlayer: f === this.player, color: f.char.color }))
        .sort((a, b) => b.kills - a.kills),
    };
    this.emit('end', this.result);
  }

  // --------------------------------------------------------------------- view

  computeView() {
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 600;
    const scale = clamp(w / 1500, 0.42, 1);
    const vw = w / scale;
    const vh = h / scale;
    const focus = this.camFocus || { x: this.map ? this.map.w / 2 : 0, y: this.map ? this.map.h / 2 : 0 };
    const mapW = this.map ? this.map.w : vw;
    const mapH = this.map ? this.map.h : vh;
    const cx = vw >= mapW ? mapW / 2 : clamp(focus.x, vw / 2, mapW - vw / 2);
    const cy = vh >= mapH ? mapH / 2 : clamp(focus.y, vh / 2, mapH - vh / 2);
    this.view = { w, h, scale, vw, vh, cx, cy };
    return this.view;
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const v = this.view;
    const sx = (clientX - rect.left) * (v.w / (rect.width || v.w));
    const sy = (clientY - rect.top) * (v.h / (rect.height || v.h));
    return {
      x: (sx - v.w / 2) / v.scale + v.cx,
      y: (sy - v.h / 2) / v.scale + v.cy,
    };
  }

  abilityState() {
    const p = this.player;
    if (!p) return { name: '', cd: 0, total: 1, ready: false };
    return {
      name: p.char.ability.name,
      hint: p.char.ability.hint,
      cd: p.abilityCd,
      total: p.char.ability.cd,
      ready: p.abilityCd <= 0,
      active: p.buffs.shield > 0 || p.buffs.surge > 0,
    };
  }
}
