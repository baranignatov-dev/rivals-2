import { useState } from 'react'
import Hero from './components/Hero.jsx'
import MapsSection from './components/MapsSection.jsx'
import CharactersSection from './components/CharactersSection.jsx'
import BossesSection from './components/BossesSection.jsx'
import ArenaDemo from './components/ArenaDemo.jsx'
import ModesSection from './components/ModesSection.jsx'
import ProgressionSection from './components/ProgressionSection.jsx'
import { BOSSES, CHARACTERS, MAPS } from './data/game.js'

const NAV = [
  { id: 'maps', label: 'Maps' },
  { id: 'characters', label: 'Characters' },
  { id: 'bosses', label: 'Bosses' },
  { id: 'arena', label: 'Arena demo' },
  { id: 'modes', label: 'Modes' },
  { id: 'progression', label: 'Progression' },
]

export default function App() {
  const [mapId, setMapId] = useState(MAPS[0].id)
  const [fighterId, setFighterId] = useState(CHARACTERS[0].id)
  const [bossId, setBossId] = useState(BOSSES[0].id)

  const map = MAPS.find((m) => m.id === mapId) ?? MAPS[0]
  const fighter = CHARACTERS.find((c) => c.id === fighterId) ?? CHARACTERS[0]
  const boss = BOSSES.find((b) => b.id === bossId) ?? BOSSES[0]

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const fightBoss = (id) => {
    setBossId(id)
    scrollTo('arena')
  }

  return (
    <>
      <header className="nav">
        <a className="nav__brand" href="#top">
          <span className="nav__mark">R2</span>
          <span className="nav__name">Rivals 2</span>
        </a>
        <nav className="nav__links" aria-label="Sections">
          {NAV.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => scrollTo('arena')}>
          Play demo
        </button>
      </header>

      <main id="top">
        <Hero map={map} fighter={fighter} onPlay={() => scrollTo('arena')} onMaps={() => scrollTo('maps')} />
        <MapsSection value={mapId} onChange={setMapId} />
        <CharactersSection value={fighterId} onChange={setFighterId} />
        <BossesSection value={bossId} onFight={fightBoss} />
        <ArenaDemo fighter={fighterId} boss={bossId} map={mapId} />
        <ModesSection />
        <ProgressionSection />
      </main>

      <footer className="footer">
        <p>
          RIVALS 2 — a 50-player multiplayer combat arena. Design document lives in{' '}
          <code>GAME_PREVIEW.md</code>; the full experience is built for Roblox.
        </p>
      </footer>
    </>
  )
}
