const STATS = [
  { value: '50', label: 'Players' },
  { value: '6', label: 'Game modes' },
  { value: '3', label: 'Arenas' },
  { value: '4', label: 'Fighters' },
  { value: '2', label: 'Bosses' },
]

export default function Hero({ map, fighter, onPlay, onMaps }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="wrap hero__inner">
        <p className="eyebrow">Multiplayer combat arena · Season one</p>
        <h1 id="hero-title" className="hero__title">
          RIVALS<span>2</span>
        </h1>
        <p className="hero__lede">
          Fifty fighters, six modes, three arenas and two bosses that do not forgive a missed dodge.
          Pick a fighter, pick a battleground, and step into the arena demo.
        </p>

        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={onPlay}>
            Enter the arena demo
          </button>
          <button type="button" className="btn btn--ghost" onClick={onMaps}>
            Tour the maps
          </button>
        </div>

        <dl className="stats">
          {STATS.map((stat) => (
            <div className="stats__item" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="hero__now">
          <span className="hero__now-label">Loaded matchup</span>
          <span className="hero__now-value">
            {fighter.name} <span className="hero__vs">vs</span> {map.name}
          </span>
        </div>
      </div>
    </section>
  )
}
