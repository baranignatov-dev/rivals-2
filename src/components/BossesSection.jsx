import { BOSSES } from '../data/game.js'

export default function BossesSection({ value, onFight }) {
  return (
    <section className="section" id="bosses" aria-labelledby="bosses-title">
      <div className="wrap">
        <header className="section__head">
          <p className="eyebrow">03 — Bosses</p>
          <h2 id="bosses-title">Two fights that end most runs</h2>
          <p className="section__lede">Big health pools, telegraphed abilities, and a real payout if you finish them.</p>
        </header>

        <div className="bosses">
          {BOSSES.map((boss) => (
            <article
              key={boss.id}
              className={`boss${boss.id === value ? ' is-active' : ''}`}
              style={{ '--accent': boss.accent }}
            >
              <div className="boss__art" aria-hidden="true">
                <span>{boss.glyph}</span>
              </div>
              <div className="boss__body">
                <h3>{boss.name}</h3>
                <p className="boss__blurb">{boss.blurb}</p>

                <div className="boss__meters">
                  <div className="meter">
                    <span className="meter__label">Health</span>
                    <span className="meter__track">
                      <span className="meter__fill" style={{ width: '100%' }} />
                    </span>
                    <span className="meter__num">{boss.hp} HP</span>
                  </div>
                  <div className="meter">
                    <span className="meter__label">Damage</span>
                    <span className="meter__num">{boss.damage} / hit</span>
                  </div>
                </div>

                <ul className="boss__abilities">
                  {boss.abilities.map((ability) => (
                    <li key={ability}>{ability}</li>
                  ))}
                </ul>

                <div className="boss__foot">
                  <span className="boss__reward">{boss.reward} coins on defeat</span>
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => onFight(boss.id)}>
                    Fight {boss.name}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
