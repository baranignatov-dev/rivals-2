export const MAPS = [
  {
    id: 'canyon',
    name: 'Crystal Canyon',
    tagline: 'Vertical crystal arena',
    blurb:
      'Layered ridges and crystal cover turn every crossing into a decision: take the high tower for sightlines or slip through the caves for close combat.',
    size: '180 × 180 m',
    hazards: ['Cave darkness', 'Narrow choke bridges'],
    features: ['Crystal tower high ground', 'Waterfall healing zone (+10 HP/s)', 'Cave system', '10 spawn points'],
    accent: '#3ee6ff',
    accent2: '#8b6cff',
  },
  {
    id: 'volcano',
    name: 'Volcano Valley',
    tagline: 'Hazard-heavy warfare',
    blurb:
      'Lava runs through the heart of the map. Hot springs burn you, lava flows kill instantly, and the bridge is the only road to the boss arena.',
    size: '210 × 160 m',
    hazards: ['Lava flows (instant death)', 'Hot springs (20 dmg/s)'],
    features: ['Volcano peak sniper position', 'Lava bridge chokepoint', 'Magma chamber boss arena', 'Rising ash cover'],
    accent: '#ff8a3d',
    accent2: '#ff3f86',
  },
  {
    id: 'fortress',
    name: 'Sky Fortress',
    tagline: 'Team objective stronghold',
    blurb:
      'A floating fortress stitched together by bridge networks. Towers hold the sightlines, the central keep holds the objective, and the beams hold everything up.',
    size: '200 × 200 m',
    hazards: ['Open edges', 'Energy beam crossfire'],
    features: ['North tower sniper nest', 'Central command keep', 'Bridge network', 'Energy beam hazards'],
    accent: '#5ee3a1',
    accent2: '#3ee6ff',
  },
]

export const CHARACTERS = [
  {
    id: 'blade',
    name: 'Blade',
    role: 'Vanguard',
    blurb: 'A duelist who closes the gap fast and punishes anyone caught reloading.',
    hp: 100,
    damage: 18,
    speed: 235,
    ability: { name: 'Blade Rush', desc: 'Dash forward and land two rapid strikes.' },
    accent: '#3ee6ff',
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'Caster',
    blurb: 'Fragile, but her blast deletes anything standing still for a second too long.',
    hp: 85,
    damage: 26,
    speed: 205,
    ability: { name: 'Nova Blast', desc: 'Charge a slow orb that detonates for area damage.' },
    accent: '#9b6cff',
  },
  {
    id: 'titan',
    name: 'Titan',
    role: 'Bulwark',
    blurb: 'Soaks up pressure, pushes objectives, and never gives the ground back.',
    hp: 135,
    damage: 14,
    speed: 175,
    ability: { name: 'Shockwave', desc: 'Slam the ground to knock back everything nearby.' },
    accent: '#ffcc4d',
  },
  {
    id: 'omega',
    name: 'Omega',
    role: 'Assassin',
    blurb: 'Fastest fighter in the roster. Arrives unseen and leaves before the fight starts.',
    hp: 90,
    damage: 30,
    speed: 265,
    ability: { name: 'Void Strike', desc: 'Blink behind the target and hit for critical damage.' },
    accent: '#ff3f86',
  },
]

export const BOSSES = [
  {
    id: 'dragon',
    name: 'Crystal Dragon',
    glyph: '🐉',
    blurb: 'Guards the Canyon caves. Fights in wide arcs and never stands still.',
    hp: 500,
    damage: 50,
    arenaDamage: 11,
    reward: 500,
    abilities: ['Breath Attack — AoE damage', 'Crystal Shards — projectile fan', 'Tail Swipe — knockback'],
    accent: '#3ee6ff',
  },
  {
    id: 'titan',
    name: 'Omega Titan',
    glyph: '🤖',
    blurb: 'The final boss of the Magma Chamber. Every hit it lands reshapes the arena.',
    hp: 750,
    damage: 75,
    arenaDamage: 15,
    reward: 1000,
    abilities: ['Earthquake — map-wide shock', 'Power Slam — area damage', 'Meteor Strike — tracking projectile'],
    accent: '#ff3f86',
  },
]

export const MODES = [
  { id: '1v1', name: '1v1', players: 2, duration: '5 min', desc: 'Pure duel. One mistake ends the round.' },
  { id: '2v2', name: '2v2', players: 4, duration: '5 min', desc: 'Pair synergy — cover each other or fall together.' },
  { id: '3v3', name: '3v3', players: 6, duration: '5 min', desc: 'Small squad rotations with tight choke control.' },
  { id: '4v4', name: '4v4', players: 8, duration: '5 min', desc: 'Objective pressure with two lanes of attack.' },
  { id: '5v5', name: '5v5', players: 10, duration: '7 min', desc: 'Full team composition, ranked ruleset.' },
  { id: 'ffa', name: 'Free For All', players: 50, duration: '10 min', desc: 'Every fighter for themselves. 50-player chaos.' },
]

export const REWARDS = [
  { label: 'Kill', value: '50 Coins + 25 XP' },
  { label: 'Win', value: '500 Coins + 250 XP' },
  { label: 'Boss Beat', value: '500 Coins + 500 XP + Skin Drop (5%)' },
  { label: 'Killstreak (5+)', value: '25 Bonus Points' },
  { label: 'Critical Hit', value: '10 Bonus Points' },
]

export const UPCOMING = [
  { icon: '🐾', name: 'Pets', desc: 'Companion pets that fight beside you.' },
  { icon: '🏍️', name: 'Vehicles', desc: 'Drive straight into the arena.' },
  { icon: '🗺️', name: 'New Maps', desc: 'More arenas, more hazards.' },
  { icon: '🏆', name: 'Ranked Mode', desc: 'Climb the competitive ladder.' },
]

export const RANKS = [
  { min: 50, name: 'Grandmaster' },
  { min: 35, name: 'Diamond' },
  { min: 20, name: 'Platinum' },
  { min: 10, name: 'Gold' },
  { min: 1, name: 'Bronze' },
]
