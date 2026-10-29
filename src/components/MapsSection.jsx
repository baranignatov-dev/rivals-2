import { MAPS } from '../data/game.js'

function MapThumb({ map }) {
  if (map.id === 'canyon') {
    return (
      <svg viewBox="0 0 320 180" className="thumb" role="img" aria-label={`${map.name} layout`}>
        <rect width="320" height="180" fill="#0a1520" />
        <path d="M0 46 L64 30 L118 52 L152 28 L212 46 L268 24 L320 48 L320 0 L0 0 Z" fill="#0f2333" />
        <path d="M0 140 L58 126 L132 148 L198 124 L262 144 L320 128 L320 180 L0 180 Z" fill="#0f2333" />
        <ellipse cx="160" cy="94" rx="116" ry="42" fill="#102033" stroke="#3ee6ff" strokeOpacity=".28" />
        <rect x="22" y="70" width="44" height="44" rx="9" fill="#081420" stroke="#3ee6ff" strokeOpacity=".3" />
        <rect x="252" y="68" width="44" height="48" rx="9" fill="#0b2a3a" stroke="#5ee3ff" strokeOpacity=".5" />
        <circle cx="160" cy="38" r="14" fill="#132a3f" stroke="#3ee6ff" strokeOpacity=".65" />
        {[
          [72, 138],
          [104, 122],
          [128, 150],
          [196, 128],
          [224, 148],
          [246, 118],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#3ee6ff" fillOpacity=".7" />
        ))}
      </svg>
    )
  }

  if (map.id === 'volcano') {
    return (
      <svg viewBox="0 0 320 180" className="thumb" role="img" aria-label={`${map.name} layout`}>
        <rect width="320" height="180" fill="#1a0d0b" />
        <path d="M160 24 L232 96 L88 96 Z" fill="#2a1310" stroke="#ff8a3d" strokeOpacity=".4" />
        <path d="M150 30 L170 30 L182 58 L138 58 Z" fill="#ff8a3d" fillOpacity=".35" />
        <path d="M0 150 C60 132 96 166 160 150 C224 134 262 168 320 148" stroke="#ff8a3d" strokeWidth="9" fill="none" strokeOpacity=".75" />
        <path d="M0 150 C60 132 96 166 160 150 C224 134 262 168 320 148" stroke="#ffd08a" strokeWidth="3" fill="none" strokeOpacity=".8" />
        <rect x="150" y="100" width="20" height="26" fill="#3a201a" stroke="#ff8a3d" strokeOpacity=".5" />
        <circle cx="160" cy="140" r="20" fill="#2a1512" stroke="#ff3f86" strokeOpacity=".55" />
        <circle cx="160" cy="42" r="6" fill="#ffd08a" />
        <rect x="246" y="60" width="42" height="34" rx="8" fill="#2a1512" stroke="#ff8a3d" strokeOpacity=".45" />
        <rect x="30" y="64" width="36" height="30" rx="8" fill="#2a1512" stroke="#ff8a3d" strokeOpacity=".45" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 320 180" className="thumb" role="img" aria-label={`${map.name} layout`}>
      <rect width="320" height="180" fill="#071a16" />
      <g stroke="#5ee3a1" strokeOpacity=".35" strokeWidth="2">
        <path d="M160 44 L86 92 L160 140 L234 92 Z" fill="#0d2721" />
        <path d="M160 44 L160 18 M86 92 L34 66 M234 92 L292 66 M160 140 L160 166" />
      </g>
      <circle cx="160" cy="92" r="22" fill="#123028" stroke="#5ee3a1" strokeOpacity=".6" />
      <circle cx="160" cy="18" r="11" fill="#123028" stroke="#5ee3a1" strokeOpacity=".5" />
      <circle cx="34" cy="66" r="10" fill="#123028" stroke="#5ee3a1" strokeOpacity=".45" />
      <circle cx="292" cy="66" r="10" fill="#123028" stroke="#5ee3a1" strokeOpacity=".45" />
      <circle cx="160" cy="166" r="10" fill="#123028" stroke="#5ee3a1" strokeOpacity=".45" />
      <path d="M86 92 L160 92 M234 92 L160 92" stroke="#3ee6ff" strokeOpacity=".5" strokeWidth="3" />
    </svg>
  )
}

export default function MapsSection({ value, onChange }) {
  const selected = MAPS.find((map) => map.id === value) ?? MAPS[0]

  return (
    <section className="section" id="maps" aria-labelledby="maps-title">
      <div className="wrap">
        <header className="section__head">
          <p className="eyebrow">01 — Arenas</p>
          <h2 id="maps-title">Three battlefields, three rule sets</h2>
          <p className="section__lede">
            Every arena changes how a fight plays out. Pick one to load it into the demo below.
          </p>
        </header>

        <div className="maps__grid">
          {MAPS.map((map) => (
            <button
              type="button"
              key={map.id}
              className={`map-card${map.id === value ? ' is-active' : ''}`}
              style={{ '--accent': map.accent, '--accent-2': map.accent2 }}
              onClick={() => onChange(map.id)}
              aria-pressed={map.id === value}
            >
              <MapThumb map={map} />
              <div className="map-card__body">
                <h3>{map.name}</h3>
                <p className="map-card__tagline">{map.tagline}</p>
                <p className="map-card__size">{map.size}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="map-detail" style={{ '--accent': selected.accent, '--accent-2': selected.accent2 }}>
          <div>
            <h3 className="map-detail__title">{selected.name}</h3>
            <p className="map-detail__blurb">{selected.blurb}</p>
          </div>
          <div className="map-detail__cols">
            <div>
              <h4>Features</h4>
              <ul>
                {selected.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Hazards</h4>
              <ul className="map-detail__hazards">
                {selected.hazards.map((hazard) => (
                  <li key={hazard}>{hazard}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
