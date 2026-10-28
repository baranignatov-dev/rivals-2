import './styles.css';
import { Game } from './game/engine.js';
import { render } from './game/render.js';
import { CHARACTERS } from './data/characters.js';
import { MAPS } from './data/maps.js';
import { MODES, MODE_KEYS } from './data/modes.js';

const $ = (sel) => document.querySelector(sel);
const PROGRESS_KEY = 'rivals2.progress';

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return { coins: 0, xp: 0, matches: 0, wins: 0, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('progress reset', err);
  }
  return { coins: 0, xp: 0, matches: 0, wins: 0 };
}

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('progress not saved', err);
  }
}

const levelFromXp = (xp) => Math.min(50, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1);
const levelFloor = (level) => Math.pow(level - 1, 2) * 120;

let progress = loadProgress();
const selection = { map: 'canyon', mode: '3v3', char: 'omega' };

const canvas = $('#arena');
const game = new Game(canvas, handleEvent);
game.minimap = $('#minimap');

// ------------------------------------------------------------------ menus

function chipsFor(map) {
  const chips = [];
  if (map.zones.some((z) => z.kind === 'heal')) chips.push(['Healing zone', 'good']);
  if (map.zones.some((z) => z.kind === 'lava')) chips.push(['Lava = instant death', 'hazard']);
  if (map.zones.some((z) => z.kind === 'damage')) chips.push(['Hazard vents', 'hazard']);
  if (map.zones.some((z) => z.kind === 'power')) chips.push(['Power-ups', 'power']);
  if (map.teleports.length) chips.push(['Teleporters', 'power']);
  if (map.platforms) chips.push(['Void drops', 'hazard']);
  chips.push([map.size, '']);
  chips.push([`${map.spawns.length} spawns`, '']);
  return chips;
}

function buildMaps() {
  const wrap = $('#map-list');
  wrap.innerHTML = '';
  Object.values(MAPS).forEach((map) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `map-card${selection.map === map.key ? ' selected' : ''}`;
    btn.dataset.key = map.key;
    btn.innerHTML = `
      <strong>${map.name}</strong>
      <small>${map.tagline}</small>
      <div class="chips">${chipsFor(map).map(([t, c]) => `<span class="chip ${c}">${t}</span>`).join('')}</div>`;
    btn.addEventListener('click', () => {
      selection.map = map.key;
      buildMaps();
    });
    wrap.appendChild(btn);
  });
}

function buildModes() {
  const wrap = $('#mode-list');
  wrap.innerHTML = '';
  MODE_KEYS.forEach((key) => {
    const mode = MODES[key];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `mode-btn${selection.mode === key ? ' selected' : ''}`;
    btn.dataset.key = key;
    btn.innerHTML = `${mode.label}<small>${mode.players}P · ${mode.kills} kills</small>`;
    btn.addEventListener('click', () => {
      selection.mode = key;
      buildModes();
    });
    wrap.appendChild(btn);
  });
  const mode = MODES[selection.mode];
  $('#mode-note').textContent =
    `${mode.players}-player ${mode.label}: first to ${mode.kills} eliminations or ${Math.round(mode.duration / 60)} minutes. ` +
    `${mode.bots} AI rivals fill the opposing team, and a boss joins the fight after 35 seconds.`;
}

function statRow(label, value) {
  return `<div class="stat-row"><span>${label}</span><span class="pip"><i style="width:${value * 10}%"></i></span><span>${value}</span></div>`;
}

function buildChars() {
  const wrap = $('#char-list');
  wrap.innerHTML = '';
  Object.values(CHARACTERS).forEach((c) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `char-card${selection.char === c.key ? ' selected' : ''}`;
    btn.dataset.key = c.key;
    btn.style.setProperty('--glow', c.glow);
    btn.innerHTML = `
      <div class="char-head">
        <span class="char-emoji">${c.emoji}</span>
        <span><strong>${c.name}</strong><small>${c.title}</small></span>
      </div>
      <p class="char-role">${c.role}</p>
      ${statRow('Speed', c.rating.speed)}
      ${statRow('Damage', c.rating.damage)}
      ${statRow('Health', c.rating.health)}
      <p class="char-blurb">${c.blurb}</p>
      <p class="char-ability"><b>${c.ability.name}</b> · ${c.ability.cd}s cooldown<br />${c.ability.hint}</p>`;
    btn.addEventListener('click', () => {
      selection.char = c.key;
      buildChars();
    });
    wrap.appendChild(btn);
  });
}

function renderProgress() {
  const level = levelFromXp(progress.xp);
  const floor = levelFloor(level);
  const next = levelFloor(level + 1);
  const pct = level >= 50 ? 100 : Math.min(100, Math.max(0, ((progress.xp - floor) / (next - floor)) * 100));
  const record = `${progress.wins}W / ${Math.max(0, progress.matches - progress.wins)}L`;
  $('#progress').innerHTML = `
    <span>Level <b>${level}</b>${level >= 50 ? ' · GRANDMASTER' : ''}</span>
    <span class="level-bar"><i style="width:${pct}%"></i></span>
    <span><b>${progress.coins.toLocaleString()}</b> coins</span>
    <span>Record <b>${progress.matches ? record : '—'}</b></span>`;
}

function showScreen(name) {
  ['menu', 'game', 'results'].forEach((id) => {
    $(`#${id}`).classList.toggle('hidden', id !== name);
  });
}

// ------------------------------------------------------------------ match

function startMatch() {
  showScreen('game');
  $('#death-screen').classList.add('hidden');
  $('#pause-screen').classList.add('hidden');
  game.start({ mapKey: selection.map, modeKey: selection.mode, charKey: selection.char });
  game.input.aimX = game.player.x + 120;
  game.input.aimY = game.player.y;
  const c = CHARACTERS[selection.char];
  $('#char-emoji').textContent = c.emoji;
  $('#char-name').textContent = c.name;
  $('#char-role').textContent = c.role;
  $('#ability-name').textContent = c.ability.name;
  $('#ability-hint').textContent = c.ability.hint;
  $('#killfeed').innerHTML = '';
  lastFrame = performance.now();
  canvas.focus();
}

function goMenu() {
  game.state = 'idle';
  game.paused = false;
  game.input.firing = false;
  mouseDown = false;
  showScreen('menu');
  renderProgress();
}

function castAbility() {
  if (game.state !== 'playing' || game.paused) return;
  game.castAbility(game.player, game.nearestEnemy(game.player), {
    x: game.input.aimX,
    y: game.input.aimY,
  });
}

function togglePause() {
  if (game.state !== 'playing') return;
  game.paused = !game.paused;
  game.input.firing = false;
  mouseDown = false;
  $('#pause-screen').classList.toggle('hidden', !game.paused);
}

function handleEvent(type, payload) {
  if (type === 'end') finishMatch(payload);
}

function finishMatch(result) {
  progress.coins += result.rewards.coins;
  progress.xp += result.rewards.xp;
  progress.matches += 1;
  if (result.win) progress.wins += 1;
  saveProgress();

  $('#outcome').textContent = result.win ? 'VICTORY' : 'DEFEAT';
  $('#outcome').classList.toggle('loss', !result.win);
  $('#result-sub').textContent = `${result.map.name} · ${result.mode.label} · ${result.char.name}${
    result.bossDefeated ? ' · boss slain' : ''
  }`;
  const secs = Math.max(0, Math.round(result.timeLeft));
  $('#result-stats').innerHTML = `
    <div><span>Eliminations</span><b>${result.kills}</b></div>
    <div><span>Deaths</span><b>${result.deaths}</b></div>
    <div><span>Best streak</span><b>${result.bestStreak}</b></div>
    <div><span>Boss</span><b>${result.bossDefeated ? 'Slain' : 'Alive'}</b></div>
    <div><span>Time left</span><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</b></div>`;
  $('#result-rewards').innerHTML = `<span>+${result.rewards.coins.toLocaleString()} coins</span><span>+${result.rewards.xp.toLocaleString()} XP</span>`;
  $('#result-board').innerHTML = `
    <thead><tr><th>Fighter</th><th>Role</th><th>Elims</th><th>Deaths</th></tr></thead>
    <tbody>${result.boards
      .map(
        (row) => `<tr class="${row.isPlayer ? 'me' : ''}">
          <td><span class="dot" style="background:${row.color}"></span>${row.name}</td>
          <td>${row.char}</td>
          <td>${row.kills}</td>
          <td>${row.deaths}</td>
        </tr>`,
      )
      .join('')}</tbody>`;
  game.paused = false;
  $('#pause-screen').classList.add('hidden');
  showScreen('results');
}

// ------------------------------------------------------------------ input

const keys = new Set();
let mouseDown = false;
let lastFrame = performance.now();
let lastFeed = '';

const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (MOVE_KEYS.has(k) || k === ' ' || k === 'q' || k === 'p') e.preventDefault();
  keys.add(k);
  if (k === 'q') castAbility();
  if (k === 'p') togglePause();
  if (k === 'escape' && game.state !== 'idle') goMenu();
  if (k === 'enter' && !$('#menu').classList.contains('hidden')) startMatch();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => {
  keys.clear();
  mouseDown = false;
});

canvas.addEventListener('mousemove', (e) => {
  const w = game.screenToWorld(e.clientX, e.clientY);
  game.input.aimX = w.x;
  game.input.aimY = w.y;
});
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    mouseDown = true;
    game.input.firing = true;
    if (game.paused) togglePause();
  } else if (e.button === 2) {
    castAbility();
  }
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    mouseDown = false;
    game.input.firing = false;
  }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

$('#ability').addEventListener('click', castAbility);
$('#start-btn').addEventListener('click', startMatch);
$('#again-btn').addEventListener('click', startMatch);
$('#menu-btn').addEventListener('click', goMenu);

// ------------------------------------------------------------------- hud

function updateHud() {
  const p = game.player;
  if (!p) return;
  $('#hud-score').textContent = `${p.kills} / ${game.killTarget}`;
  const t = Math.max(0, Math.ceil(game.timeLeft));
  $('#hud-timer').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  const lead = game.leadingBot();
  $('#hud-leader').textContent = lead ? `${lead.name} ${lead.kills}` : '—';

  const hpPct = Math.max(0, p.hp / p.maxHp) * 100;
  $('#hp-fill').style.width = `${hpPct}%`;
  $('#hp-text').textContent = Math.ceil(Math.max(0, p.hp));

  const ab = game.abilityState();
  $('#ability').classList.toggle('ready', ab.ready);
  $('#ability-cd').textContent = ab.ready ? 'READY' : `${ab.cd.toFixed(1)}s`;

  const bossBar = $('#boss-bar');
  if (game.boss && game.boss.alive) {
    bossBar.classList.remove('hidden');
    $('#boss-name').textContent = `${game.boss.data.emoji} ${game.boss.data.name}`;
    $('#boss-fill').style.width = `${Math.max(0, (game.boss.hp / game.boss.maxHp) * 100)}%`;
  } else {
    bossBar.classList.add('hidden');
  }

  const banner = $('#banner');
  if (game.banner) {
    banner.classList.remove('hidden');
    $('#banner-main').textContent = game.banner.text;
    $('#banner-sub').textContent = game.banner.sub || '';
  } else {
    banner.classList.add('hidden');
  }

  const feedKey = game.feed.map((f) => f.text).join('|');
  if (feedKey !== lastFeed) {
    lastFeed = feedKey;
    $('#killfeed').innerHTML = game.feed.map((f) => `<li>${f.text}</li>`).join('');
  }

  const death = $('#death-screen');
  if (!p.alive) {
    death.classList.remove('hidden');
    $('#death-sub').textContent = `respawning in ${Math.max(0, p.respawn).toFixed(1)}s`;
  } else {
    death.classList.add('hidden');
  }
}

// ------------------------------------------------------------------- loop

function frame(now) {
  const dt = (now - lastFrame) / 1000;
  lastFrame = now;
  if (game.state === 'playing' && game.map) {
    game.input.moveX =
      (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    game.input.moveY =
      (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
    game.input.firing = mouseDown || keys.has(' ');
    game.update(dt);
    render(game, now / 1000);
    updateHud();
  }
  requestAnimationFrame(frame);
}

buildMaps();
buildModes();
buildChars();
renderProgress();
requestAnimationFrame(frame);
