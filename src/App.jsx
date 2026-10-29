import { useCallback, useEffect, useRef, useState } from 'react'
import { TOOLS, blankScene, demoScene, normalizeScene } from './engine/scene'
import EditorStage from './components/EditorStage'
import ToolPalette from './components/ToolPalette'
import Inspector from './components/Inspector'
import ScriptPanel from './components/ScriptPanel'
import ConsolePanel from './components/ConsolePanel'
import PlayStage from './components/PlayStage'

const STORAGE_KEY = 'forge-game-v2'
const clone = (value) => JSON.parse(JSON.stringify(value))

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeScene(JSON.parse(raw))
  } catch {
    return null
  }
}

export default function App() {
  const [scene, setScene] = useState(() => loadSaved() || blankScene())
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('build')
  const [scriptTarget, setScriptTarget] = useState('level')
  const [playing, setPlaying] = useState(false)
  const [logs, setLogs] = useState([])
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const fileRef = useRef(null)
  const sceneRef = useRef(scene)
  sceneRef.current = scene

  const selected = scene.objects.find((o) => o.id === selectedId) || null

  const onScene = useCallback((updater) => {
    setScene((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-39), clone(sceneRef.current)])
    setFuture([])
  }, [])

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setFuture((f) => [...f, clone(sceneRef.current)])
      setScene(prev)
      return h.slice(0, -1)
    })
  }

  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f
      const next = f[f.length - 1]
      setHistory((h) => [...h, clone(sceneRef.current)])
      setScene(next)
      return f.slice(0, -1)
    })
  }

  const updateObject = useCallback(
    (patch) => {
      if (!selectedId) return
      setScene((s) => ({
        ...s,
        objects: s.objects.map((o) => (o.id === selectedId ? { ...o, ...patch } : o)),
      }))
    },
    [selectedId],
  )

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    pushHistory()
    setScene((s) => ({ ...s, objects: s.objects.filter((o) => o.id !== selectedId) }))
    setSelectedId(null)
  }, [selectedId, pushHistory])

  const addLog = useCallback((entry) => {
    setLogs((prev) => [...prev.slice(-120), { ...entry, at: Date.now() }])
  }, [])

  const exportScene = () => {
    const blob = new Blob([JSON.stringify(scene, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = (scene.name.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'level') + '.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importScene = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      pushHistory()
      setScene(normalizeScene(data))
      setSelectedId(null)
    } catch {
      addLog({ level: 'error', message: 'That file could not be read as a level.' })
      setTab('console')
    }
  }

  const newLevel = () => {
    if (!window.confirm('Start a fresh level? This replaces what is on the canvas.')) return
    pushHistory()
    setScene(blankScene())
    setSelectedId(null)
    setTab('build')
  }

  const loadDemo = () => {
    if (!window.confirm('Load the example level? It replaces what is on the canvas.')) return
    pushHistory()
    setScene(demoScene())
    setSelectedId(null)
    setTab('build')
  }

  const openCode = () => {
    setScriptTarget(selectedId ? 'object' : 'level')
    setTab('script')
  }

  const changeScript = (next) => {
    if (scriptTarget === 'level') onScene((s) => ({ ...s, script: next }))
    else updateObject({ script: next })
  }

  const editSelectedScript = () => {
    setScriptTarget('object')
    setTab('script')
  }

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scene))
      } catch {
        /* storage full or blocked — the canvas still works */
      }
    }, 400)
    return () => clearTimeout(id)
  }, [scene])

  useEffect(() => {
    const onKey = (e) => {
      if (playing) {
        if (e.key === 'Escape') setPlaying(false)
        return
      }
      const tag = e.target?.tagName
      const typing =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable
      if (typing) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        deleteSelected()
        return
      }
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, selectedId, deleteSelected])

  const activeTool = TOOLS.find((t) => t.id === tool)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⚒
          </span>
          <span className="brand-name">Forge</span>
          <span className="badge">free · no coins</span>
        </div>

        <input
          className="title-input"
          value={scene.name}
          maxLength={40}
          aria-label="Game name"
          onChange={(e) => onScene((s) => ({ ...s, name: e.target.value }))}
        />

        <div className="topbar-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={undo} disabled={!history.length}>
            Undo
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={redo} disabled={!future.length}>
            Redo
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={exportScene}>
            Export
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={loadDemo}>
            Demo
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={newLevel}>
            New
          </button>
          <button type="button" className="btn btn-code" onClick={openCode}>
            {'{ }'} Code
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setPlaying(true)}>
            ▶ Play
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={importScene}
        />
      </header>

      <main className="workspace">
        <ToolPalette tool={tool} onChange={setTool} />

        <div className="stage-col">
          <EditorStage
            scene={scene}
            tool={tool}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onScene={onScene}
            onPushHistory={pushHistory}
          />
          <div className="stage-hint">{activeTool?.hint}</div>
        </div>

        <aside className="panel">
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={tab === 'build' ? 'is-active' : ''}
              onClick={() => setTab('build')}
            >
              Build
            </button>
            <button
              type="button"
              role="tab"
              className={tab === 'script' ? 'is-active' : ''}
              onClick={() => setTab('script')}
            >
              Script
            </button>
            <button
              type="button"
              role="tab"
              className={tab === 'console' ? 'is-active' : ''}
              onClick={() => setTab('console')}
            >
              Console{logs.length ? ` (${logs.length})` : ''}
            </button>
          </div>

          {tab === 'build' && (
            <Inspector
              scene={scene}
              selected={selected}
              onScene={onScene}
              onObject={updateObject}
              onEditScript={editSelectedScript}
              onDelete={deleteSelected}
            />
          )}
          {tab === 'script' && (
            <ScriptPanel
              scene={scene}
              selected={selected}
              target={scriptTarget}
              onTarget={setScriptTarget}
              onChange={changeScript}
            />
          )}
          {tab === 'console' && (
            <ConsolePanel logs={logs} onClear={() => setLogs([])} />
          )}
        </aside>
      </main>

      {playing && (
        <PlayStage
          scene={scene}
          onExit={() => setPlaying(false)}
          onLog={addLog}
        />
      )}
    </div>
  )
}
