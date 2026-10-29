import { useCallback, useEffect, useRef, useState } from 'react'
import { GameRuntime } from '../engine/runtime'
import { drawScene } from '../engine/render'

const KEY_MAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
}

export default function PlayStage({ scene, onExit, onLog }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const runtimeRef = useRef(null)
  const [runId, setRunId] = useState(0)
  const [hud, setHud] = useState({ deaths: 0, time: 0, status: '', toast: '', won: false })

  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  // input: keyboard
  useEffect(() => {
    const down = (e) => {
      const action = KEY_MAP[e.code]
      if (!action) return
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
      runtimeRef.current?.setKey(action, true)
    }
    const up = (e) => {
      const action = KEY_MAP[e.code]
      if (!action) return
      runtimeRef.current?.setKey(action, false)
    }
    const blur = () => {
      const rt = runtimeRef.current
      if (rt) {
        rt.setKey('left', false)
        rt.setKey('right', false)
        rt.setKey('jump', false)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  useEffect(() => {
    const runtime = new GameRuntime(scene, {
      onLog: (entry) => onLogRef.current?.(entry),
    })
    runtimeRef.current = runtime

    let raf = 0
    let last = performance.now()
    let hudAt = 0
    let alive = true
    let prevHud = ''

    const loop = (now) => {
      if (!alive) return
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05))
      last = now
      runtime.step(dt)

      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = Math.round(rect.width * dpr)
        const h = Math.round(rect.height * dpr)
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
        }
        const ctx = canvas.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        drawScene(ctx, scene, {
          cssW: rect.width,
          cssH: rect.height,
          mode: 'play',
          runtime,
          time: runtime.time,
        })
      }

      if (now - hudAt > 100) {
        hudAt = now
        const next = {
          deaths: runtime.deaths,
          time: Math.floor(runtime.time),
          status: runtime.statusText,
          toast: runtime.time < runtime.toastUntil ? runtime.toastText : '',
          won: runtime.won,
        }
        const signature = JSON.stringify(next)
        if (signature !== prevHud) {
          prevHud = signature
          setHud(next)
        }
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [runId, scene])

  const press = useCallback((action, down) => (e) => {
    e.preventDefault()
    runtimeRef.current?.setKey(action, down)
  }, [])

  const restart = () => {
    setHud({ deaths: 0, time: 0, status: '', toast: '', won: false })
    setRunId((id) => id + 1)
  }

  return (
    <div className="play-overlay">
      <div className="play-top">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onExit}>
          ← Build
        </button>
        <div className="play-stats">
          <span className="stat">
            <em>Time</em> {hud.time}s
          </span>
          <span className="stat">
            <em>Falls</em> {hud.deaths}
          </span>
          {hud.status ? <span className="stat stat-status">{hud.status}</span> : null}
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={restart}>
          Restart
        </button>
      </div>

      <div className="play-stage" ref={wrapRef}>
        <canvas ref={canvasRef} className="play-canvas" />
        {hud.toast ? <div className="toast">{hud.toast}</div> : null}
        {hud.won ? (
          <div className="win-banner">
            <strong>Level clear!</strong>
            <span>{hud.deaths === 0 ? 'Flawless run — no falls.' : `${hud.deaths} falls on the way.`}</span>
            <div className="win-actions">
              <button type="button" className="btn btn-primary" onClick={restart}>
                Play again
              </button>
              <button type="button" className="btn btn-ghost" onClick={onExit}>
                Back to building
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="touch-pad" aria-label="Touch controls">
        <div className="touch-group">
          <button
            type="button"
            className="touch-btn"
            onPointerDown={press('left', true)}
            onPointerUp={press('left', false)}
            onPointerCancel={press('left', false)}
            onPointerLeave={press('left', false)}
            onContextMenu={(e) => e.preventDefault()}
          >
            ◀
          </button>
          <button
            type="button"
            className="touch-btn"
            onPointerDown={press('right', true)}
            onPointerUp={press('right', false)}
            onPointerCancel={press('right', false)}
            onPointerLeave={press('right', false)}
            onContextMenu={(e) => e.preventDefault()}
          >
            ▶
          </button>
        </div>
        <button
          type="button"
          className="touch-btn touch-jump"
          onPointerDown={press('jump', true)}
          onPointerUp={press('jump', false)}
          onPointerCancel={press('jump', false)}
          onPointerLeave={press('jump', false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          Jump
        </button>
      </div>
    </div>
  )
}
