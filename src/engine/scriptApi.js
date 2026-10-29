export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * Turns the script the user typed into a real function we can call.
 * A syntax error throws here and is reported in the console panel.
 *
 * The body runs on every call, so a pasted script that just does things
 * keeps doing them. Optional onStart / onUpdate / onTouch functions,
 * declared anywhere in the script, are detected and called too.
 */
export function compileScript(src) {
  const body = `${src}
;return {
  onStart: typeof onStart === 'function' ? onStart : null,
  onUpdate: typeof onUpdate === 'function' ? onUpdate : null,
  onTouch: typeof onTouch === 'function' ? onTouch : null
};`
  return new Function('self', 'player', 'api', 'game', 'keys', 'dt', 'Math', 'console', body)
}

export function createApi(runtime, owner) {
  const api = {
    get time() {
      return runtime.time
    },
    get player() {
      return runtime.player
    },
    get objects() {
      return runtime.objects
    },
    get keys() {
      return runtime.keys
    },
    get scene() {
      return runtime.scene
    },

    log: (...args) => runtime.log(args),
    say: (text, seconds) => runtime.say(text, seconds),
    hud: (text) => {
      runtime.statusText = String(text ?? '')
    },
    win: () => runtime.win(),
    respawn: () => runtime.respawn(),
    gravity: (g) => {
      const next = Number(g)
      if (Number.isFinite(next)) runtime.scene.gravity = next
    },
    spawn: (opts) => runtime.spawn(opts),
    remove: (target) => runtime.remove(target ?? owner),
    touch: (a, b) => overlap(a, b),
    distance: (a, b) =>
      Math.hypot(a.x + a.w / 2 - (b.x + b.w / 2), a.y + a.h / 2 - (b.y + b.h / 2)),
    rand: (min, max) => min + Math.random() * (max - min),
    pick: (list) => (Array.isArray(list) && list.length ? list[Math.floor(Math.random() * list.length)] : undefined),
    clamp: (v, min, max) => Math.min(Math.max(v, min), max),
    lerp: (a, b, t) => a + (b - a) * t,
    onStart: (fn) => {
      if (typeof fn === 'function') runtime.startHooks.push(fn)
    },
  }

  api.console = {
    log: (...a) => runtime.log(a),
    info: (...a) => runtime.log(a),
    warn: (...a) => runtime.log(a, 'warn'),
    error: (...a) => runtime.log(a, 'error'),
  }

  return api
}
