import { TYPE_COLORS } from '../engine/scene'

function NumberField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export default function Inspector({ scene, selected, onScene, onObject, onEditScript, onDelete }) {
  if (!selected) {
    return (
      <div className="panel-body">
        <section className="card">
          <h3 className="card-title">Level</h3>
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              value={scene.name}
              maxLength={40}
              onChange={(e) => onScene((s) => ({ ...s, name: e.target.value }))}
            />
          </label>
          <NumberField
            label="Gravity"
            value={scene.gravity}
            min={200}
            max={6000}
            step={50}
            onChange={(v) => onScene((s) => ({ ...s, gravity: Math.max(200, v || 1900) }))}
          />
          <p className="hint">{scene.objects.length} objects on this level.</p>
        </section>

        <section className="card">
          <h3 className="card-title">How it works</h3>
          <ol className="steps">
            <li>Pick a tool from the palette.</li>
            <li>Drag on the canvas to build ground, tap to drop things.</li>
            <li>Tap anything to select it and give it a script.</li>
            <li>Hit Play. Everything is free — no coins, no unlocks.</li>
          </ol>
        </section>
      </div>
    )
  }

  const typeLabel = selected.type === 'entity' ? 'script object' : selected.type
  return (
    <div className="panel-body">
      <section className="card">
        <div className="card-head">
          <h3 className="card-title">
            <span className="dot" style={{ background: selected.color || TYPE_COLORS[selected.type] }} />
            {typeLabel}
          </h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete}>
            Delete
          </button>
        </div>

        <div className="grid-2">
          <NumberField label="X" value={selected.x} onChange={(v) => onObject({ x: v })} />
          <NumberField label="Y" value={selected.y} onChange={(v) => onObject({ y: v })} />
          <NumberField label="Width" value={selected.w} min={12} onChange={(v) => onObject({ w: Math.max(12, v) })} />
          <NumberField label="Height" value={selected.h} min={12} onChange={(v) => onObject({ h: Math.max(12, v) })} />
        </div>

        <label className="field">
          <span>Colour</span>
          <input
            type="color"
            value={selected.color || TYPE_COLORS[selected.type] || '#3f6f9c'}
            onChange={(e) => onObject({ color: e.target.value })}
          />
        </label>

        {selected.type === 'enemy' && (
          <>
            <label className="field">
              <span>Behaviour</span>
              <select value={selected.behavior} onChange={(e) => onObject({ behavior: e.target.value })}>
                <option value="patrol">Patrol</option>
                <option value="chase">Chase the player</option>
                <option value="static">Stand still</option>
              </select>
            </label>
            <div className="grid-2">
              <NumberField label="Range" value={selected.range} min={0} onChange={(v) => onObject({ range: Math.max(0, v) })} />
              <NumberField label="Speed" value={selected.speed} min={0} onChange={(v) => onObject({ speed: Math.max(0, v) })} />
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h3 className="card-title">Behaviour</h3>
          <button type="button" className="btn btn-primary btn-sm" onClick={onEditScript}>
            {selected.script && selected.script.trim() ? 'Edit script' : 'Add script'}
          </button>
        </div>
        <p className="hint">
          {selected.script && selected.script.trim()
            ? 'This object runs your code every frame while the game plays.'
            : 'No code yet. Attach a script to make this thing do anything you want.'}
        </p>
      </section>
    </div>
  )
}
