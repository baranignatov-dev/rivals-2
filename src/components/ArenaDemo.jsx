import { useEffect, useRef, useState } from 'react'
import { BOSSES, CHARACTERS, MAPS } from '../data/game.js'

const W = 960
const H = 540

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const THEMES = {
  canyon: { base: '#050c14', grid: 'rgba(120,190,230,.08)' },
  volcano: { base: '#120707', grid: 'rgba(230,150,110,.08)' },
  fortress: { base: '#04120f', grid: 'rgba(120,230,180,.08)' },
}

export default function ArenaDemo({ fighter, boss, map }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const inputRef = useRef({ keys: new Set(), aim: null, firing: false, touch: null })
  const [hud, setHud] = useState({ status: 'ready', playerHp: 1, bossHp: 1, coins: 0, note: '' })

  const fighterData = CHARACTERS.find((c) => c.id === fighter) ?? CHARACTERS[0]
  const bossData = BOSSES.find((b) => b.id === boss) ?? BOSSES[0]
  const mapData = MAPS.find((m) => m.id === map) ?? MAPS[0]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const f = fighterData
    const b = bossData
    const theme = THEMES[mapData.id] ?? THEMES.canyon

    const game = {
      status: 'ready',
      t: 0,
      coins: 0,
      note: '',
      contactCd: 0,
      player: { x: W / 2, y: H - 130, r: 15, hp: f.hp, maxHp: f.hp, cd: 0, flash: 0 },
      boss: { x: W / 2, y: 140, r: 34, hp: b.hp, maxHp: b.hp, cd: 1.4, flash: 0 },
      shots: [],
      hazards: [],
    }

    const pushHud = () =>
      setHud({
        status: game.status,
        playerHp: game.player.hp / game.player.maxHp,
        bossHp: game.boss.hp / game.boss.maxHp,
        coins: game.coins,
        note: game.note,
      })

    gameRef.current = {
      start() {
        game.status = 'running'
        game.t = 0
        game.coins = 0
        game.note = ''
        game.contactCd = 0
        game.shots = []
        game.hazards = []
        game.player = { x: W / 2, y: H - 130, r: 15, hp: f.hp, maxHp: f.hp, cd: 0, flash: 0 }
        game.boss = { x: W / 2, y: 140, r: 34, hp: b.hp, maxHp: b.hp, cd: 1.4, flash: 0 }
        inputRef.current.touch = null
        inputRef.current.firing = false
        inputRef.current.aim = null
        pushHud()
      },
    }

    function update(dt) {
      game.t += dt
      const p = game.player
      const bs = game.boss
      const keys = inputRef.current.keys

      let mx = 0
      let my = 0
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1
      if (keys.has('d') || keys.has('arrowright')) mx += 1
      if (keys.has('w') || keys.has('arrowup')) my -= 1
      if (keys.has('s') || keys.has('arrowdown')) my += 1
      if (mx || my) {
        const len = Math.hypot(mx, my)
        p.x += (mx / len) * f.speed * dt
        p.y += (my / len) * f.speed * dt
      }

      const touch = inputRef.current.touch
      if (touch) {
        const tdx = touch.x - p.x
        const tdy = touch.y - p.y
        const tdist = Math.hypot(tdx, tdy)
        if (tdist > 8) {
          const step = Math.min(tdist, f.speed * dt)
          p.x += (tdx / tdist) * step
          p.y += (tdy / tdist) * step
        }
      }

      p.x = clamp(p.x, p.r + 10, W - p.r - 10)
      p.y = clamp(p.y, p.r + 10, H - p.r - 10)
      p.flash = Math.max(0, p.flash - dt)

      p.cd = Math.max(0, p.cd - dt)
      const wantsFire = inputRef.current.firing || keys.has(' ')
      if (wantsFire && p.cd <= 0) {
        const aim = inputRef.current.aim
        const tx = aim && !touch ? aim.x : bs.x
        const ty = aim && !touch ? aim.y : bs.y
        const dx = tx - p.x
        const dy = ty - p.y
        const d = Math.hypot(dx, dy) || 1
        game.shots.push({
          x: p.x + (dx / d) * 20,
          y: p.y + (dy / d) * 20,
          vx: (dx / d) * 560,
          vy: (dy / d) * 560,
          r: 6,
          dmg: f.damage,
          life: 1.6,
        })
        p.cd = 0.22
      }

      const dx = p.x - bs.x
      const dy = p.y - bs.y
      const dist = Math.hypot(dx, dy) || 1
      const bossSpeed = 72 + (1 - bs.hp / bs.maxHp) * 46
      const dir = dist > 240 ? 1 : dist < 155 ? -1 : 0
      bs.x = clamp(bs.x + (dx / dist) * bossSpeed * dir * dt, bs.r + 12, W - bs.r - 12)
      bs.y = clamp(bs.y + (dy / dist) * bossSpeed * dir * dt, bs.r + 12, H - bs.r - 12)
      bs.flash = Math.max(0, bs.flash - dt)

      bs.cd -= dt
      const enraged = bs.hp / bs.maxHp < 0.4
      if (bs.cd <= 0) {
        const spread = enraged ? 5 : 3
        const base = Math.atan2(dy, dx)
        for (let i = 0; i < spread; i += 1) {
          const angle = base + (i - (spread - 1) / 2) * 0.24
          game.hazards.push({
            x: bs.x,
            y: bs.y,
            vx: Math.cos(angle) * 235,
            vy: Math.sin(angle) * 235,
            r: 8,
            dmg: b.arenaDamage,
            life: 3,
          })
        }
        bs.cd = enraged ? 1.1 : 1.9
      }

      game.shots = game.shots.filter((s) => {
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.life -= dt
        if (Math.hypot(s.x - bs.x, s.y - bs.y) < bs.r + s.r) {
          bs.hp -= s.dmg
          bs.flash = 0.12
          return false
        }
        return s.life > 0 && s.x > -30 && s.x < W + 30 && s.y > -30 && s.y < H + 30
      })

      game.hazards = game.hazards.filter((s) => {
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.life -= dt
        if (Math.hypot(s.x - p.x, s.y - p.y) < p.r + s.r) {
          p.hp -= s.dmg
          p.flash = 0.15
          return false
        }
        return s.life > 0 && s.x > -30 && s.x < W + 30 && s.y > -30 && s.y < H + 30
      })

      game.contactCd = Math.max(0, game.contactCd - dt)
      if (dist < bs.r + p.r && game.contactCd <= 0) {
        p.hp -= 8
        p.flash = 0.16
        game.contactCd = 0.7
        p.x = clamp(p.x - (dx / dist) * 30, p.r + 10, W - p.r - 10)
        p.y = clamp(p.y - (dy / dist) * 30, p.r + 10, H - p.r - 10)
      }

      if (bs.hp <= 0) {
        bs.hp = 0
        game.status = 'won'
        game.coins = b.reward
        game.note = `${b.name} defeated — ${b.reward} coins earned.`
        pushHud()
      } else if (p.hp <= 0) {
        p.hp = 0
        game.status = 'lost'
        game.coins = 0
        game.note = `${b.name} held the arena. Try another fighter or map.`
        pushHud()
      }
    }

    function draw() {
      const p = game.player
      const bs = game.boss

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = theme.base
      ctx.fillRect(0, 0, W, H)

      const glow = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, W * 0.75)
      glow.addColorStop(0, alpha(mapData.accent, 0.14))
      glow.addColorStop(0.55, alpha(mapData.accent2, 0.05))
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = theme.grid
      ctx.lineWidth = 1
      for (let x = 48; x < W; x += 48) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      for (let y = 48; y < H; y += 48) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }

      ctx.strokeStyle = alpha(mapData.accent, 0.3)
      ctx.lineWidth = 2
      ctx.strokeRect(10, 10, W - 20, H - 20)

      ctx.fillStyle = alpha(mapData.accent, 0.5)
      ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`${mapData.name.toUpperCase()} · ARENA DEMO`, 26, 26)

      // boss spawn pad
      ctx.beginPath()
      ctx.arc(bs.x, bs.y, bs.r + 26, 0, Math.PI * 2)
      ctx.strokeStyle = alpha(b.accent, 0.22)
      ctx.lineWidth = 1.5
      ctx.stroke()

      // boss
      ctx.save()
      ctx.shadowColor = b.accent
      ctx.shadowBlur = 26
      ctx.beginPath()
      for (let i = 0; i < 6; i += 1) {
        const a = game.t * 0.4 + (i * Math.PI * 2) / 6
        const x = bs.x + Math.cos(a) * bs.r
        const y = bs.y + Math.sin(a) * bs.r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = bs.flash > 0 ? '#ffffff' : alpha(b.accent, 0.24)
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = bs.flash > 0 ? '#ffffff' : b.accent
      ctx.stroke()
      ctx.restore()

      ctx.font = '28px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(b.glyph, bs.x, bs.y + 1)

      // hazards
      for (const h of game.hazards) {
        ctx.beginPath()
        ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2)
        ctx.fillStyle = alpha(b.accent, 0.9)
        ctx.fill()
      }

      // player shots
      for (const s of game.shots) {
        ctx.save()
        ctx.shadowColor = f.accent
        ctx.shadowBlur = 14
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = '#f4fbff'
        ctx.fill()
        ctx.restore()
      }

      // player
      ctx.save()
      ctx.shadowColor = f.accent
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.flash > 0 ? '#ffffff' : f.accent
      ctx.fill()
      ctx.restore()
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2)
      ctx.strokeStyle = alpha(f.accent, 0.5)
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.font = '700 13px ui-sans-serif, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#06070c'
      ctx.fillText(f.name.slice(0, 1), p.x, p.y + 1)

      const aim = inputRef.current.aim
      if (aim && !inputRef.current.touch) {
        ctx.beginPath()
        ctx.arc(aim.x, aim.y, 9, 0, Math.PI * 2)
        ctx.strokeStyle = alpha(f.accent, 0.55)
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    let raf = 0
    let last = performance.now()
    let hudTimer = 0
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (game.status === 'running') update(dt)
      draw()
      hudTimer += dt
      if (hudTimer > 0.1) {
        hudTimer = 0
        pushHud()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(raf)
  }, [fighterData, bossData, mapData])

  useEffect(() => {
    const keys = inputRef.current.keys
    const moveKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']

    const onDown = (event) => {
      const key = event.key.toLowerCase()
      if (!moveKeys.includes(key)) return
      if (key === ' ') event.preventDefault()
      keys.add(key)
    }
    const onUp = (event) => {
      keys.delete(event.key.toLowerCase())
    }
    const onBlur = () => {
      keys.clear()
      inputRef.current.firing = false
      inputRef.current.touch = null
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  const toArena = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    }
  }

  const onPointerDown = (event) => {
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId)
    } catch {
      // synthetic or already-released pointer — steering still works without capture
    }
    const point = toArena(event)
    inputRef.current.firing = true
    if (event.pointerType === 'touch') {
      inputRef.current.touch = point
      inputRef.current.aim = null
    } else {
      inputRef.current.aim = point
    }
  }

  const onPointerMove = (event) => {
    if (event.pointerType === 'touch') {
      if (inputRef.current.touch) inputRef.current.touch = toArena(event)
      return
    }
    inputRef.current.aim = toArena(event)
  }

  const release = () => {
    inputRef.current.firing = false
    inputRef.current.touch = null
  }

  const running = hud.status === 'running'
  const finished = hud.status === 'won' || hud.status === 'lost'

  return (
    <section className="section section--alt" id="arena" aria-labelledby="arena-title">
      <div className="wrap">
        <header className="section__head">
          <p className="eyebrow">04 — Gameplay</p>
          <h2 id="arena-title">Step into the arena</h2>
          <p className="section__lede">
            A playable slice of the fight loop: move, shoot, dodge the boss pattern and finish it. The full 50-player
            modes run in Roblox.
          </p>
        </header>

        <div className="arena" style={{ '--accent': mapData.accent, '--accent-2': mapData.accent2 }}>
          <div className="arena__hud">
            <div className="arena__side">
              <div className="arena__names">
                <strong style={{ color: fighterData.accent }}>{fighterData.name}</strong>
                <span>
                  {fighterData.role} · {fighterData.ability.name}
                </span>
              </div>
              <div className="bar">
                <span
                  className="bar__fill"
                  style={{
                    width: `${Math.max(0, hud.playerHp) * 100}%`,
                    background: fighterData.accent,
                  }}
                />
              </div>
            </div>

            <div className="arena__vs">
              <span>{running ? 'LIVE' : finished ? 'ROUND OVER' : 'READY'}</span>
              <small>
                {mapData.name} · {bossData.name}
              </small>
            </div>

            <div className="arena__side arena__side--boss">
              <div className="arena__names">
                <strong style={{ color: bossData.accent }}>{bossData.name}</strong>
                <span>
                  {bossData.hp} HP · {bossData.damage} dmg
                </span>
              </div>
              <div className="bar">
                <span
                  className="bar__fill"
                  style={{
                    width: `${Math.max(0, hud.bossHp) * 100}%`,
                    background: bossData.accent,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="arena__stage">
            <canvas
              ref={canvasRef}
              className="arena__canvas"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={release}
              onPointerCancel={release}
              onPointerLeave={release}
            />

            {!running && (
              <div className="arena__overlay">
                {finished ? (
                  <>
                    <p className="arena__overlay-kicker">{hud.status === 'won' ? 'Victory' : 'Defeat'}</p>
                    <h3>{hud.note}</h3>
                    <p className="arena__overlay-text">
                      {hud.status === 'won'
                        ? `Coins banked: ${hud.coins}.`
                        : 'Boss pattern: it fires a fan of shards, then closes the gap.'}
                    </p>
                    <button type="button" className="btn btn--primary" onClick={() => gameRef.current?.start()}>
                      Run it again
                    </button>
                  </>
                ) : (
                  <>
                    <p className="arena__overlay-kicker">Arena demo</p>
                    <h3>
                      {fighterData.name} vs {bossData.name}
                    </h3>
                    <p className="arena__overlay-text">
                      WASD or arrows to move. Hold space (or the mouse) to fire. On touch, hold and drag to steer.
                    </p>
                    <button type="button" className="btn btn--primary" onClick={() => gameRef.current?.start()}>
                      Start the fight
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <ul className="arena__controls">
            <li>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> move
            </li>
            <li>
              <kbd>Space</kbd> / <kbd>Click</kbd> fire
            </li>
            <li>
              <kbd>Drag</kbd> steer on touch
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
