const SNIPPETS = [
  {
    label: 'Move object',
    code: `self.x = 900 + Math.sin(api.time) * 220`,
  },
  {
    label: 'Say on touch',
    code: `function onTouch(player) {\n  api.say('Nice!', 2)\n}`,
  },
  {
    label: 'Spawn a platform',
    code: `api.spawn({ type: 'platform', x: 700, y: 400, w: 200, h: 24 })`,
  },
  {
    label: 'Win the level',
    code: `api.win()`,
  },
]

const API_DOCS = `self      this object (x, y, w, h, vars)
player    the player object
api.say('text', seconds)     show a message
api.hud('text')              set the status line
api.win() / api.respawn()
api.spawn({ type, x, y, w, h, script })
api.remove(target)           target defaults to self
api.touch(a, b)              are two objects overlapping?
api.distance(a, b)
api.gravity(1200)
api.onStart(fn)              run once, right at the beginning
api.log(...)                 print into the console tab
api.time / api.keys / api.objects / api.player
api.rand(min, max) / api.pick(list) / api.clamp / api.lerp

Your code runs every frame. If you declare onStart(),
onUpdate(dt) or onTouch(player), they get called too.`

export default function ScriptPanel({ scene, selected, target, onTarget, onChange }) {
  const isLevel = target === 'level'
  const hasObject = Boolean(selected)
  const value = isLevel ? scene.script : selected?.script || ''
  const disabled = !isLevel && !hasObject

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = value.slice(0, start) + '  ' + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2
    })
  }

  return (
    <div className="panel-body">
      <div className="segmented">
        <button
          type="button"
          className={isLevel ? 'is-active' : ''}
          onClick={() => onTarget('level')}
        >
          Level script
        </button>
        <button
          type="button"
          className={!isLevel ? 'is-active' : ''}
          onClick={() => onTarget('object')}
        >
          {hasObject ? (selected.type === 'entity' ? 'Script object' : selected.type) : 'No object'}
        </button>
      </div>

      {disabled ? (
        <p className="empty">
          Tap an object on the canvas to give it code, or write in the level script.
        </p>
      ) : (
        <>
          <textarea
            className="code-editor"
            value={value}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            placeholder={'// Your script goes here\napi.say(\'Hello!\')'}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="snippet-row">
            {SNIPPETS.map((s) => (
              <button
                key={s.label}
                type="button"
                className="chip"
                onClick={() => onChange(value ? value.replace(/\s*$/, '') + '\n\n' + s.code + '\n' : s.code + '\n')}
              >
                {s.label}
              </button>
            ))}
          </div>

          <details className="docs">
            <summary>Script cheat sheet</summary>
            <pre>{API_DOCS}</pre>
          </details>
        </>
      )}
    </div>
  )
}
