// Bosses from the design doc: Crystal Dragon (500 HP / 50 dmg) and Omega Titan
// (750 HP / 75 dmg) with their listed abilities.

export const BOSSES = {
  crystalDragon: {
    key: 'crystalDragon',
    name: 'Crystal Dragon',
    emoji: '🐉',
    maxHp: 500,
    damage: 50,
    speed: 118,
    radius: 52,
    color: '#7dd3fc',
    reward: { coins: 500, xp: 500 },
    abilities: [
      { key: 'breath', name: 'Breath Attack', cd: 5, radius: 210 },
      { key: 'shards', name: 'Crystal Shards', cd: 3, count: 8 },
      { key: 'tail', name: 'Tail Swipe', cd: 8, radius: 150 },
    ],
  },
  omegaTitan: {
    key: 'omegaTitan',
    name: 'Omega Titan',
    emoji: '🤖',
    maxHp: 750,
    damage: 75,
    speed: 96,
    radius: 58,
    color: '#fb923c',
    reward: { coins: 1000, xp: 500 },
    abilities: [
      { key: 'earthquake', name: 'Earthquake', cd: 6, radius: 250 },
      { key: 'meteor', name: 'Meteor Strike', cd: 4, count: 5 },
      { key: 'slam', name: 'Power Slam', cd: 9, radius: 180 },
    ],
  },
};
