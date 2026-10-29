import { MODES } from '../data/game.js'

export default function ModesSection() {
  return (
    <section className="section" id="modes" aria-labelledby="modes-title">
      <div className="wrap">
        <header className="section__head">
          <p className="eyebrow">05 — Modes</p>
          <h2 id="modes-title">Six ways to queue up</h2>
          <p className="section__lede">Everything from a clean 1v1 duel to a 50-player free-for-all.</p>
        </header>

        <div className="modes">
          {MODES.map((mode) => (
            <article className={`mode${mode.id === 'ffa' ? ' mode--wide' : ''}`} key={mode.id}>
              <div className="mode__top">
                <h3>{mode.name}</h3>
                <span className="mode__players">{mode.players}p</span>
              </div>
              <p className="mode__desc">{mode.desc}</p>
              <p className="mode__meta">
                <span>{mode.players} players</span>
                <span>{mode.duration}</span>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
