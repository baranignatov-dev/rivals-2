import { useState } from 'react'
import { RANKS, REWARDS, UPCOMING } from '../data/game.js'

function rankFor(level) {
  return RANKS.find((rank) => level >= rank.min) ?? RANKS[RANKS.length - 1]
}

export default function ProgressionSection() {
  const [level, setLevel] = useState(12)
  const rank = rankFor(level)
  const pct = Math.round((level / 50) * 100)

  return (
    <section className="section section--alt" id="progression" aria-labelledby="progression-title">
      <div className="wrap">
        <header className="section__head">
          <p className="eyebrow">06 — Progression</p>
          <h2 id="progression-title">Earn, unlock, level up</h2>
          <p className="section__lede">Coins and XP feed a 50-level track that pays out skins, cosmetics and ranks.</p>
        </header>

        <div className="progression">
          <div className="panel">
            <h3>Rewards</h3>
            <ul className="rewards">
              {REWARDS.map((reward) => (
                <li key={reward.label}>
                  <span>{reward.label}</span>
                  <strong>{reward.value}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <h3>Level track</h3>
            <div className="level">
              <div className="level__readout">
                <span>
                  Level <strong>{level}</strong>
                </span>
                <span className="level__rank" style={{ color: level >= 50 ? '#ffcc4d' : undefined }}>
                  {rank.name}
                  {level >= 50 ? ' ⭐' : ''}
                </span>
              </div>
              <div className="level__track">
                <span className="level__fill" style={{ width: `${pct}%` }} />
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={level}
                onChange={(event) => setLevel(Number(event.target.value))}
                aria-label="Preview a level"
              />
              <p className="level__hint">
                Drag to preview the rewards at any level — {level * 100} XP earned, {level * 1200} coins unlocked.
              </p>
            </div>

            <h3 className="upcoming__title">Coming next</h3>
            <ul className="upcoming">
              {UPCOMING.map((item) => (
                <li key={item.name}>
                  <span aria-hidden="true">{item.icon}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.desc}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
