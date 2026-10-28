// The three arenas from the design doc. Shapes are circles or capsules:
//   { kind:'circle', x, y, r }  |  { kind:'capsule', x1, y1, x2, y2, r }
// covers = solid, blocks movement and shots.
// platforms = walkable ground (Sky Fortress only); anywhere else is void.
// zones = area effects: heal | damage | lava | void | power.

export const ARENA = { w: 2200, h: 1500 };

export const MAPS = {
  canyon: {
    key: 'canyon',
    name: 'Crystal Canyon',
    tagline: 'Elevation, crystal cover and a healing waterfall',
    size: 'Medium',
    w: ARENA.w,
    h: ARENA.h,
    boss: 'crystalDragon',
    bossSpawn: { x: 1100, y: 780 },
    palette: {
      ground: ['#0d1b2e', '#173454'],
      grid: 'rgba(125, 211, 252, 0.07)',
      cover: '#1e3a5f',
      coverEdge: 'rgba(125, 211, 252, 0.55)',
      accent: '#7dd3fc',
      fog: 'rgba(14, 116, 144, 0.22)',
    },
    elevated: [{ x: 1100, y: 400, r: 180, label: 'CRYSTAL TOWER' }],
    covers: [
      { kind: 'circle', x: 760, y: 380, r: 64 },
      { kind: 'circle', x: 1460, y: 380, r: 70 },
      { kind: 'circle', x: 340, y: 900, r: 58 },
      { kind: 'circle', x: 1880, y: 880, r: 62 },
      { kind: 'circle', x: 900, y: 1080, r: 54 },
      { kind: 'circle', x: 1340, y: 1120, r: 58 },
      { kind: 'capsule', x1: 300, y1: 560, x2: 300, y2: 700, r: 34 },
      { kind: 'capsule', x1: 1900, y1: 520, x2: 1900, y2: 680, r: 34 },
    ],
    zones: [
      { kind: 'heal', shape: { kind: 'circle', x: 560, y: 700, r: 135 }, rate: 10, label: 'WATERFALL +10 HP/S' },
      { kind: 'power', shape: { kind: 'circle', x: 1640, y: 980, r: 110 }, label: 'CRYSTAL SURGE' },
      { kind: 'dark', shape: { kind: 'capsule', x1: 1720, y1: 300, x2: 2000, y2: 300, r: 95 }, label: 'CAVE SYSTEM' },
    ],
    teleports: [],
    spawns: [
      { x: 220, y: 220 }, { x: 1100, y: 180 }, { x: 1980, y: 220 },
      { x: 220, y: 760 }, { x: 1980, y: 1160 }, { x: 640, y: 1320 },
      { x: 1560, y: 1320 }, { x: 1100, y: 1320 }, { x: 480, y: 1080 },
      { x: 1720, y: 620 },
    ],
  },

  volcano: {
    key: 'volcano',
    name: 'Volcano Valley',
    tagline: 'Lava chokepoints, hot springs and a magma basin',
    size: 'Large',
    w: ARENA.w,
    h: ARENA.h,
    boss: 'omegaTitan',
    bossSpawn: { x: 1100, y: 1180 },
    palette: {
      ground: ['#1a0d0a', '#3a150c'],
      grid: 'rgba(251, 146, 60, 0.08)',
      cover: '#3b1a12',
      coverEdge: 'rgba(251, 146, 60, 0.5)',
      accent: '#fb923c',
      fog: 'rgba(190, 24, 24, 0.2)',
    },
    elevated: [{ x: 1100, y: 300, r: 200, label: 'VOLCANO PEAK' }],
    covers: [
      { kind: 'circle', x: 460, y: 420, r: 66 },
      { kind: 'circle', x: 1740, y: 420, r: 66 },
      { kind: 'circle', x: 380, y: 1120, r: 58 },
      { kind: 'circle', x: 1820, y: 1120, r: 58 },
      { kind: 'circle', x: 900, y: 640, r: 46 },
      { kind: 'circle', x: 1300, y: 640, r: 46 },
      { kind: 'capsule', x1: 820, y1: 980, x2: 820, y2: 1120, r: 32 },
      { kind: 'capsule', x1: 1380, y1: 980, x2: 1380, y2: 1120, r: 32 },
    ],
    zones: [
      { kind: 'lava', shape: { kind: 'circle', x: 640, y: 860, r: 130 }, label: 'LAVA FLOW' },
      { kind: 'lava', shape: { kind: 'circle', x: 1580, y: 880, r: 120 }, label: 'LAVA FLOW' },
      { kind: 'lava', shape: { kind: 'capsule', x1: 860, y1: 760, x2: 1320, y2: 800, r: 44 }, label: 'LAVA BRIDGE' },
      { kind: 'damage', shape: { kind: 'circle', x: 780, y: 480, r: 105 }, rate: 20, label: 'HOT SPRINGS −20 HP/S' },
      { kind: 'power', shape: { kind: 'circle', x: 1500, y: 520, r: 100 }, label: 'POWER-UP' },
    ],
    teleports: [],
    spawns: [
      { x: 200, y: 240 }, { x: 1100, y: 170 }, { x: 2000, y: 240 },
      { x: 200, y: 800 }, { x: 2000, y: 800 }, { x: 200, y: 1320 },
      { x: 2000, y: 1320 }, { x: 1100, y: 560 }, { x: 700, y: 1320 },
      { x: 1500, y: 1320 },
    ],
  },

  fortress: {
    key: 'fortress',
    name: 'Sky Fortress',
    tagline: 'Floating platforms, energy bridges and the void below',
    size: 'Vertical',
    w: ARENA.w,
    h: ARENA.h,
    boss: 'crystalDragon',
    bossSpawn: { x: 1100, y: 750 },
    palette: {
      ground: ['#070a1c', '#111a3d'],
      grid: 'rgba(129, 140, 248, 0.09)',
      cover: '#1b2450',
      coverEdge: 'rgba(129, 140, 248, 0.6)',
      accent: '#818cf8',
      fog: 'rgba(49, 46, 129, 0.25)',
    },
    elevated: [
      { x: 1100, y: 250, r: 150, label: 'NORTH TOWER' },
      { x: 1100, y: 1250, r: 150, label: 'SOUTH TOWER' },
    ],
    platforms: [
      { kind: 'circle', x: 1100, y: 750, r: 340 },
      { kind: 'circle', x: 1100, y: 250, r: 165 },
      { kind: 'circle', x: 1100, y: 1250, r: 165 },
      { kind: 'circle', x: 400, y: 750, r: 175 },
      { kind: 'circle', x: 1820, y: 750, r: 175 },
      { kind: 'capsule', x1: 1100, y1: 420, x2: 1100, y2: 250, r: 46 },
      { kind: 'capsule', x1: 1100, y1: 1080, x2: 1100, y2: 1250, r: 46 },
      { kind: 'capsule', x1: 760, y1: 750, x2: 400, y2: 750, r: 46 },
      { kind: 'capsule', x1: 1440, y1: 750, x2: 1820, y2: 750, r: 46 },
    ],
    covers: [
      { kind: 'circle', x: 980, y: 640, r: 52 },
      { kind: 'circle', x: 1220, y: 860, r: 52 },
      { kind: 'circle', x: 1100, y: 250, r: 44 },
      { kind: 'circle', x: 400, y: 750, r: 40 },
    ],
    zones: [
      { kind: 'power', shape: { kind: 'circle', x: 1100, y: 1250, r: 120 }, label: 'POWER-UP ZONE' },
      { kind: 'void', shape: { kind: 'circle', x: 1820, y: 750, r: 150 }, rate: 0, label: 'SKY PLATFORM' },
    ],
    teleports: [
      { a: { x: 1100, y: 1330 }, b: { x: 1100, y: 170 } },
      { a: { x: 350, y: 750 }, b: { x: 1870, y: 750 } },
    ],
    spawns: [
      { x: 1100, y: 250 }, { x: 1100, y: 1250 }, { x: 400, y: 750 },
      { x: 1820, y: 750 }, { x: 900, y: 620 }, { x: 1300, y: 900 },
      { x: 1100, y: 750 }, { x: 640, y: 700 }, { x: 1560, y: 800 },
      { x: 1100, y: 500 },
    ],
  },
};

export const MAP_KEYS = Object.keys(MAPS);
