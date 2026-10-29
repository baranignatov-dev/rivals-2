export const SCENE_W = 1600
export const SCENE_H = 900
export const GRID = 20

export const TOOLS = [
  { id: 'select', label: 'Move', hint: 'Tap something to select or drag it around.' },
  { id: 'platform', label: 'Platform', hint: 'Drag to draw solid ground.' },
  { id: 'hazard', label: 'Hazard', hint: 'Drag to draw spikes. Touching them sends you back to spawn.' },
  { id: 'goal', label: 'Goal', hint: 'Tap to place the finish flag.' },
  { id: 'spawn', label: 'Spawn', hint: 'Tap to move where the player starts.' },
  { id: 'enemy', label: 'Enemy', hint: 'Tap to add an enemy. It walks or chases you.' },
  { id: 'entity', label: 'Script', hint: 'Tap to add a blank object you control with code.' },
  { id: 'erase', label: 'Erase', hint: 'Tap any object to delete it.' },
]

export const TYPE_COLORS = {
  platform: '#3f6f9c',
  hazard: '#ff5c7a',
  goal: '#a3ff57',
  spawn: '#4dd8ff',
  enemy: '#ff8a3d',
  entity: '#b98bff',
}

let counter = 0
export function uid() {
  counter += 1
  return 'o' + Date.now().toString(36) + counter.toString(36)
}

export function snap(v) {
  return Math.round(v / GRID) * GRID
}

const DEFAULT_SIZE = {
  platform: [160, 32],
  hazard: [140, 32],
  goal: [44, 68],
  spawn: [44, 60],
  enemy: [38, 38],
  entity: [44, 44],
}

export function newObject(type, x, y, w, h) {
  const [dw, dh] = DEFAULT_SIZE[type] || [48, 48]
  const width = w ?? dw
  const height = h ?? dh
  // placement tools drop the object centred on the pointer
  const left = w == null ? snap(x - width / 2) : snap(x)
  const top = h == null ? snap(y - height / 2) : snap(y)
  return {
    id: uid(),
    type,
    x: left,
    y: top,
    w: Math.max(width, 20),
    h: Math.max(height, 20),
    color: TYPE_COLORS[type],
    behavior: type === 'enemy' ? 'patrol' : 'script',
    range: 160,
    speed: 90,
    script: '',
  }
}

export const LEVEL_SCRIPT_EXAMPLE = `// Level script — this code really runs.
// The body runs every frame; onStart() runs once, onUpdate(dt) runs each frame.

function onStart() {
  api.say('Reach the green flag!', 3)
}

// Try things like:
//   api.spawn({ type: 'platform', x: 800, y: 300, w: 240, h: 24 })
//   api.gravity(1200)
//   api.hud('Doors opened')
`

export const ENTITY_SCRIPT_EXAMPLE = `// This code controls the object it is attached to.
// self.x / self.y move it, api.* talks to the game.

self.vars.baseY = self.vars.baseY ?? self.y
self.y = self.vars.baseY + Math.sin(api.time * 2) * 28

function onStart() {
  api.log('Script object is awake')
}

function onTouch(player) {
  api.say('Secret found!', 2)
  player.vy = -900
}
`

export function starterScene() {
  const make = (type, x, y, w, h, extra = {}) => {
    const o = newObject(type, x, y, w, h)
    return { ...o, ...extra }
  }
  return {
    name: 'My First Game',
    gravity: 1900,
    script: LEVEL_SCRIPT_EXAMPLE,
    objects: [
      // ground
      make('platform', 0, 820, 540, 80),
      make('platform', 720, 820, 420, 80),
      make('platform', 1220, 820, 380, 80),
      // floating routes
      make('platform', 300, 660, 200, 28),
      make('platform', 620, 560, 180, 28),
      make('platform', 930, 470, 200, 28),
      make('platform', 1240, 620, 180, 28),
      // hazards
      make('hazard', 560, 860, 160, 40),
      make('hazard', 1150, 868, 60, 32),
      // start + finish
      make('spawn', 120, 760, 44, 60),
      make('goal', 1480, 752, 44, 68),
      // an enemy on the first platform
      make('enemy', 380, 622, 38, 38, { behavior: 'patrol', range: 120, speed: 90 }),
      // a fully scripted object
      make('entity', 950, 300, 44, 44, { script: ENTITY_SCRIPT_EXAMPLE }),
    ],
  }
}

export function emptyScene() {
  return {
    name: 'Untitled Game',
    gravity: 1900,
    script: LEVEL_SCRIPT_EXAMPLE,
    objects: [
      { ...newObject('platform', 0, 820, 1600, 80) },
      { ...newObject('spawn', 120, 760, 44, 60) },
    ],
  }
}

export function normalizeScene(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.objects)) return starterScene()
  const objects = raw.objects
    .filter((o) => o && typeof o === 'object' && TYPE_COLORS[o.type])
    .map((o) => ({
      id: o.id || uid(),
      type: o.type,
      x: Number(o.x) || 0,
      y: Number(o.y) || 0,
      w: Math.max(Number(o.w) || 40, 12),
      h: Math.max(Number(o.h) || 40, 12),
      color: typeof o.color === 'string' ? o.color : TYPE_COLORS[o.type],
      behavior: o.behavior === 'chase' ? 'chase' : o.behavior === 'static' ? 'static' : 'patrol',
      range: Number(o.range) || 160,
      speed: Number(o.speed) || 90,
      script: typeof o.script === 'string' ? o.script : '',
    }))
  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Untitled Game',
    gravity: Number(raw.gravity) || 1900,
    script: typeof raw.script === 'string' ? raw.script : '',
    objects,
  }
}
