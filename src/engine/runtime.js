import { SCENE_H, SCENE_W } from './scene'
import { compileScript, createApi, overlap } from './scriptApi'

const PLAYER_W = 34
const PLAYER_H = 46
const MOVE_SPEED = 340
const JUMP_FORCE = 800
const MAX_FALL = 1800

function runtimeObject(opts = {}) {
  return {
    id: 'r' + Math.random().toString(36).slice(2, 9),
    type: opts.type || 'platform',
    x: Number(opts.x) || 0,
    y: Number(opts.y) || 0,
    w: Math.max(Number(opts.w) || 80, 4),
    h: Math.max(Number(opts.h) || 24, 4),
    color: typeof opts.color === 'string' ? opts.color : null,
    behavior: opts.behavior === 'chase' || opts.behavior === 'patrol' ? opts.behavior : 'static',
    range: Number(opts.range) || 0,
    speed: Number(opts.speed) || 0,
    script: typeof opts.script === 'string' ? opts.script : '',
    vars: {},
    vx: 0,
    vy: 0,
    baseX: Number(opts.x) || 0,
    baseY: Number(opts.y) || 0,
    dir: 1,
    __compiled: null,
    __src: null,
    __started: false,
    __touching: false,
  }
}

export class GameRuntime {
  constructor(scene, hooks = {}) {
    this.scene = JSON.parse(JSON.stringify(scene))
    this.hooks = hooks
    this.time = 0
    this.won = false
    this.deaths = 0
    this.statusText = ''
    this.toastText = ''
    this.toastUntil = 0
    this.startHooks = []
    this.loggedErrors = new Set()
    this.keys = { left: false, right: false, jump: false }
    this.jumpHeld = false
    this.api = createApi(this, null)
    this.build()
  }

  build() {
    this.objects = this.scene.objects.map((o) => ({ ...o, ...runtimeObject(o), script: o.script || '' }))
    const spawn = this.objects.find((o) => o.type === 'spawn')
    this.spawnPoint = spawn
      ? { x: spawn.x + spawn.w / 2 - PLAYER_W / 2, y: spawn.y + spawn.h - PLAYER_H }
      : { x: 80, y: SCENE_H - 200 }
    this.player = {
      x: this.spawnPoint.x,
      y: this.spawnPoint.y,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      onGround: false,
      vars: {},
    }
    this.levelSrc = null
    this.levelCompiled = null
    this.levelStarted = false
    this.levelTouching = false

    const rt = this
    this.game = {
      get player() {
        return rt.player
      },
      get objects() {
        return rt.objects
      },
      get scene() {
        return rt.scene
      },
      get time() {
        return rt.time
      },
      get won() {
        return rt.won
      },
      win: () => rt.win(),
      respawn: () => rt.respawn(),
      say: (text, seconds) => rt.say(text, seconds),
      spawn: (opts) => rt.spawn(opts),
    }
  }

  log(args, level = 'log') {
    const message = args
      .map((a) => {
        if (typeof a === 'string') return a
        try {
          return JSON.stringify(a)
        } catch {
          return String(a)
        }
      })
      .join(' ')
    this.hooks.onLog?.({ level, message: message || '(empty)' })
  }

  reportError(src, err) {
    const text = `Script error: ${err && err.message ? err.message : String(err)}`
    const key = src + text
    if (this.loggedErrors.has(key)) return
    this.loggedErrors.add(key)
    this.hooks.onLog?.({ level: 'error', message: text })
    this.say('Script error — check the console', 3)
  }

  say(text, seconds = 2) {
    this.toastText = String(text ?? '')
    this.toastUntil = this.time + (Number(seconds) || 2)
  }

  spawn(opts) {
    const obj = runtimeObject(opts)
    this.objects.push(obj)
    return obj
  }

  remove(target) {
    if (!target) return
    const idx = this.objects.indexOf(target)
    if (idx >= 0) this.objects.splice(idx, 1)
  }

  win() {
    if (this.won) return
    this.won = true
    this.say('You win!', 4)
    this.hooks.onWin?.()
  }

  respawn() {
    const p = this.player
    p.x = this.spawnPoint.x
    p.y = this.spawnPoint.y
    p.vx = 0
    p.vy = 0
  }

  kill(reason) {
    this.deaths += 1
    this.respawn()
    if (reason) this.say(reason, 1.6)
  }

  setKey(name, down) {
    if (name in this.keys) this.keys[name] = down
  }

  step(dt) {
    if (this.won) return
    const stepDt = Math.max(0, Math.min(dt, 1 / 30))
    this.time += stepDt
    const p = this.player
    const solids = this.objects.filter((o) => o.type === 'platform')

    // 1. horizontal movement + wall collisions
    p.vx = (this.keys.right ? MOVE_SPEED : 0) - (this.keys.left ? MOVE_SPEED : 0)
    p.x += p.vx * stepDt
    for (const s of solids) {
      if (!overlap(p, s)) continue
      if (p.x + p.w / 2 < s.x + s.w / 2) p.x = s.x - p.w
      else p.x = s.x + s.w
    }

    // 2. jump
    if (this.keys.jump && !this.jumpHeld && p.onGround) {
      p.vy = -JUMP_FORCE
      p.onGround = false
    }
    if (!this.keys.jump && p.vy < -260) p.vy = -260
    this.jumpHeld = this.keys.jump

    // 3. gravity + ground collisions
    p.vy = Math.min(p.vy + this.scene.gravity * stepDt, MAX_FALL)
    const prevBottom = p.y + p.h
    p.y += p.vy * stepDt
    p.onGround = false
    for (const s of solids) {
      if (!overlap(p, s)) continue
      if (p.vy >= 0 && prevBottom <= s.y + 10) {
        p.y = s.y - p.h
        p.vy = 0
        p.onGround = true
      } else if (p.vy < 0) {
        p.y = s.y + s.h
        p.vy = 0
      }
    }

    // 4. enemies
    for (const o of this.objects) {
      if (o.type !== 'enemy') continue
      if (o.behavior === 'patrol') {
        o.x += o.speed * o.dir * stepDt
        if (o.x > o.baseX + o.range) {
          o.x = o.baseX + o.range
          o.dir = -1
        } else if (o.x < o.baseX - o.range) {
          o.x = o.baseX - o.range
          o.dir = 1
        }
      } else if (o.behavior === 'chase') {
        const dx = p.x + p.w / 2 - (o.x + o.w / 2)
        if (Math.abs(dx) < 640) o.x += Math.sign(dx) * o.speed * stepDt
      }
    }

    // 5. scripts
    this.runObjectScripts(stepDt)
    this.runLevelScript(stepDt)

    // 6. hazards, enemies, goal
    for (const o of this.objects) {
      if (o.type === 'hazard' && overlap(p, o)) {
        this.kill('Spikes!')
        break
      }
      if (o.type === 'enemy' && overlap(p, o)) {
        this.kill('Caught by an enemy!')
        break
      }
    }
    for (const o of this.objects) {
      if (o.type === 'goal' && overlap(p, o)) {
        this.win()
        break
      }
    }

    // 7. fell off the world
    if (p.y > SCENE_H + 320) {
      this.deaths += 1
      this.respawn()
      this.say('Fell out of the level', 1.6)
    }
  }

  runObjectScripts(dt) {
    for (const o of this.objects) {
      if (!o.script || !o.script.trim()) {
        o.__touching = false
        continue
      }
      this.execScript(o, o.script, o, dt)
    }
  }

  runLevelScript(dt) {
    const src = this.scene.script
    if (!src || !src.trim()) return
    this.execScript(this, src, this.player, dt, true)
  }

  execScript(owner, src, self, dt, isLevel = false) {
    const compiling = isLevel
      ? owner.levelSrc !== src
      : owner.__src !== src
    if (compiling) {
      try {
        const compiled = compileScript(src)
        if (isLevel) {
          owner.levelCompiled = compiled
          owner.levelSrc = src
          owner.levelStarted = false
        } else {
          owner.__compiled = compiled
          owner.__src = src
          owner.__started = false
        }
      } catch (err) {
        if (isLevel) {
          owner.levelCompiled = null
          owner.levelSrc = src
        } else {
          owner.__compiled = null
          owner.__src = src
        }
        this.reportError(src, err)
        return
      }
    }

    const compiled = isLevel ? owner.levelCompiled : owner.__compiled
    if (!compiled) return

    let exports
    try {
      exports = compiled(self, this.player, this.api, this.game, this.keys, dt, Math, this.api.console)
    } catch (err) {
      this.reportError(src, err)
      return
    }
    if (!exports) return

    const started = isLevel ? owner.levelStarted : owner.__started
    if (!started) {
      if (isLevel) owner.levelStarted = true
      else owner.__started = true
      if (exports.onStart) {
        try {
          exports.onStart()
        } catch (err) {
          this.reportError(src, err)
        }
      }
    }

    if (exports.onUpdate) {
      try {
        exports.onUpdate(dt)
      } catch (err) {
        this.reportError(src, err)
      }
    }

    if (exports.onTouch && !isLevel) {
      const touching = overlap(self, this.player)
      if (touching && !owner.__touching) {
        try {
          exports.onTouch(this.player, self)
        } catch (err) {
          this.reportError(src, err)
        }
      }
      owner.__touching = touching
    }
  }
}

export { SCENE_W, SCENE_H, PLAYER_W, PLAYER_H }
