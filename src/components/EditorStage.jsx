import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { newObject, snap } from '../engine/scene'
import { drawScene, makeLayout } from '../engine/render'

const PLACE_TOOLS = ['goal', 'spawn', 'enemy', 'entity']

export default function EditorStage({ scene, tool, selectedId, onSelect, onScene, onPushHistory }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const layoutRef = useRef({ scale: 1, ox: 0, oy: 0 })
  const dragRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [draft, setDraft] = useState(null)
  const [hover, setHover] = useState(null)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const measure = () => {
      const r = wrap.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.w || !size.h) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(size.w * dpr)
    canvas.height = Math.round(size.h * dpr)
    canvas.style.width = size.w + 'px'
    canvas.style.height = size.h + 'px'
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    layoutRef.current = makeLayout(size.w, size.h)
    drawScene(ctx, scene, {
      cssW: size.w,
      cssH: size.h,
      mode: 'edit',
      selectedId,
      hover,
      tool,
      draft,
    })
  }, [scene, selectedId, hover, tool, draft, size])

  const toScene = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const { scale, ox, oy } = layoutRef.current
    return { x: (e.clientX - rect.left - ox) / scale, y: (e.clientY - rect.top - oy) / scale }
  }

  const hitTest = (pt) => {
    const pad = 10
    for (let i = scene.objects.length - 1; i >= 0; i -= 1) {
      const o = scene.objects[i]
      if (pt.x >= o.x - pad && pt.x <= o.x + o.w + pad && pt.y >= o.y - pad && pt.y <= o.y + o.h + pad) {
        return o
      }
    }
    return null
  }

  const addObject = (obj, replaceType) => {
    onScene((s) => ({
      ...s,
      objects: [...(replaceType ? s.objects.filter((o) => o.type !== replaceType) : s.objects), obj],
    }))
    onSelect(obj.id)
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    try {
      canvasRef.current.setPointerCapture(e.pointerId)
    } catch {
      /* synthetic pointer events have no active pointer to capture */
    }
    const pt = toScene(e)

    if (tool === 'erase') {
      const hit = hitTest(pt)
      if (hit) {
        onPushHistory()
        onScene((s) => ({ ...s, objects: s.objects.filter((o) => o.id !== hit.id) }))
        if (selectedId === hit.id) onSelect(null)
      }
      return
    }

    if (tool === 'select') {
      const hit = hitTest(pt)
      onSelect(hit ? hit.id : null)
      if (hit) {
        onPushHistory()
        dragRef.current = { kind: 'move', id: hit.id, dx: pt.x - hit.x, dy: pt.y - hit.y }
      }
      return
    }

    if (tool === 'platform' || tool === 'hazard') {
      const start = { x: snap(pt.x), y: snap(pt.y) }
      dragRef.current = { kind: 'rect', type: tool, start, current: start }
      setDraft({ type: tool, start, current: start })
      return
    }

    if (PLACE_TOOLS.includes(tool)) {
      onPushHistory()
      addObject(newObject(tool, pt.x, pt.y), tool === 'spawn' ? 'spawn' : null)
    }
  }

  const onPointerMove = (e) => {
    const pt = toScene(e)
    const drag = dragRef.current
    if (!drag) {
      setHover(pt)
      return
    }
    if (drag.kind === 'rect') {
      drag.current = { x: snap(pt.x), y: snap(pt.y) }
      setDraft({ type: drag.type, start: drag.start, current: drag.current })
      return
    }
    if (drag.kind === 'move') {
      const nx = snap(pt.x - drag.dx)
      const ny = snap(pt.y - drag.dy)
      onScene((s) => ({
        ...s,
        objects: s.objects.map((o) => (o.id === drag.id ? { ...o, x: nx, y: ny } : o)),
      }))
    }
  }

  const onPointerUp = () => {
    const drag = dragRef.current
    dragRef.current = null
    setDraft(null)
    if (drag?.kind !== 'rect') return

    const x = Math.min(drag.start.x, drag.current.x)
    const y = Math.min(drag.start.y, drag.current.y)
    const w = Math.abs(drag.current.x - drag.start.x)
    const h = Math.abs(drag.current.y - drag.start.y)
    onPushHistory()
    if (w < 24 || h < 24) {
      addObject(newObject(drag.type, drag.start.x, drag.start.y))
    } else {
      addObject(newObject(drag.type, x, y, w, h))
    }
  }

  return (
    <div className="stage" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className={'stage-canvas tool-' + tool}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setHover(null)}
      />
    </div>
  )
}
