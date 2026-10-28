// Game modes from the design doc. Bot counts are scaled down from the 50-player
// headline number so a round stays readable in a browser arena.

export const MODES = {
  '1v1': { key: '1v1', label: '1v1', players: 2, bots: 1, kills: 5, duration: 300 },
  '2v2': { key: '2v2', label: '2v2', players: 4, bots: 2, kills: 7, duration: 300 },
  '3v3': { key: '3v3', label: '3v3', players: 6, bots: 3, kills: 8, duration: 300 },
  '4v4': { key: '4v4', label: '4v4', players: 8, bots: 4, kills: 10, duration: 300 },
  '5v5': { key: '5v5', label: '5v5', players: 10, bots: 5, kills: 12, duration: 420 },
  ffa: { key: 'ffa', label: 'Free For All', players: 50, bots: 7, kills: 10, duration: 600 },
};

export const MODE_KEYS = Object.keys(MODES);
