import { TOOLS } from '../engine/scene'

const ICONS = {
  select: '↖',
  platform: '▬',
  hazard: '▲',
  goal: '⚑',
  spawn: '◎',
  enemy: '☠',
  entity: '{ }',
  erase: '⌫',
}

export default function ToolPalette({ tool, onChange }) {
  return (
    <nav className="toolrail" aria-label="Build tools">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={'tool' + (tool === t.id ? ' is-active' : '')}
          onClick={() => onChange(t.id)}
          title={t.hint}
          aria-pressed={tool === t.id}
        >
          <span className="tool-icon" aria-hidden="true">
            {ICONS[t.id]}
          </span>
          <span className="tool-label">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
