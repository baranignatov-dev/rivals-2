import { CHARACTERS } from '../data/game.js'

const MAX = { hp: 135, damage: 30, speed: 265 }

function Stat({ label, value, max, suffix, accent }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value}
        {suffix}
      </span>
      <span className="stat__track">
        <span className="stat__fill" style={{ width: `${pct}%`, background: accent }} />
      </span>
    </div>
  )
}

export default function CharactersSection({ value, onChange }) {
  return (
    <section className="section section--alt" id="characters" aria-labelledby="characters-title">
      <div className="wrap">
        <header className="section__head">
          <p className="eyebrow">02 — Roster</p>
          <h2 id="characters-title">Pick the fighter you would main</h2>
          <p className="section__lede">
            Four fighters, four very different answers to the same fight. Your pick loads into the arena demo.
          </p>
        </header>

        <div className="roster">
          {CHARACTERS.map((character) => (
            <button
              type="button"
              key={character.id}
              className={`fighter${character.id === value ? ' is-active' : ''}`}
              style={{ '--accent': character.accent }}
              onClick={() => onChange(character.id)}
              aria-pressed={character.id === value}
            >
              <div className="fighter__head">
                <span className="fighter__avatar" aria-hidden="true">
                  {character.name.slice(0, 1)}
                </span>
                <div>
                  <h3>{character.name}</h3>
                  <p className="fighter__role">{character.role}</p>
                </div>
              </div>
              <p className="fighter__blurb">{character.blurb}</p>
              <div className="fighter__stats">
                <Stat label="HP" value={character.hp} max={MAX.hp} accent={character.accent} />
                <Stat label="Damage" value={character.damage} max={MAX.damage} accent={character.accent} />
                <Stat label="Speed" value={character.speed} max={MAX.speed} suffix=" u/s" accent={character.accent} />
              </div>
              <p className="fighter__ability">
                <span>{character.ability.name}</span> {character.ability.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
