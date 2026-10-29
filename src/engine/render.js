import { SCENE_H, SCENE_W } from './scene'

const SKY_TOP = '#0c2136'
const SKY_BOTTOM = '#081019'

export function makeLayout(cssW, cssH) {
  const scale = Math.min(cssW / SCENE_W, cssH / SCENE_H)
  return {
    scale,
    ox: (cssW - SCENE_W * scale) / 2,
    oy: (cssH - SCENE_H * scale) / 2,
  }
}

export function sceneToCanvas(pt, layout) {
  return { x: pt.x * layout.scale + layout.ox, y: pt.y * layout.scale + layout.oy }
}

export function canvasToScene(pt, layout) {
  return { x: (pt.x - layout.ox) / layout.scale, y: (pt.y - layout.oy) / layout.scale }
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawBackground(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, SCENE_H)
  sky.addColorStop(0, SKY_TOP)
  sky.addColorStop(1, SKY_BOTTOM)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, SCENE_W, SCENE_H)

  const glow = ctx.createRadialGradient(1180, 180, 20, 1180, 180, 520)
  glow.addColorStop(0, 'rgba(77, 216, 255, 0.20)')
  glow.addColorStop(1, 'rgba(77, 216, 255, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, SCENE_W, SCENE_H)

  const glow2 = ctx.createRadialGradient(300, 720, 20, 300, 720, 460)
  glow2.addColorStop(0, 'rgba(163, 255, 87, 0.10)')
  glow2.addColorStop(1, 'rgba(163, 255, 87, 0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, SCENE_W, SCENE_H)
}

function drawGrid(ctx, layout) {
  ctx.save()
  ctx.strokeStyle = 'rgba(120, 180, 220, 0.10)'
  ctx.lineWidth = 1 / Math.max(layout.scale, 0.2)
  for (let x = 0; x <= SCENE_W; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, SCENE_H)
    ctx.stroke()
  }
  for (let y = 0; y <= SCENE_H; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(SCENE_W, y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawPlatform(ctx, o, runtime) {
  ctx.save()
  roundRect(ctx, o.x, o.y, o.w, o.h, 8)
  ctx.fillStyle = o.color || '#3f6f9c'
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillRect(o.x + 6, o.y + 2, Math.max(o.w - 12, 0), 3)
  ctx.strokeStyle = 'rgba(10, 20, 30, 0.45)'
  ctx.lineWidth = 2
  roundRect(ctx, o.x, o.y, o.w, o.h, 8)
  ctx.stroke()
  ctx.restore()
  if (runtime) void 0
}

function drawHazard(ctx, o) {
  const spikes = Math.max(2, Math.floor(o.w / 22))
  const step = o.w / spikes
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(o.x, o.y + o.h)
  for (let i = 0; i < spikes; i += 1) {
    ctx.lineTo(o.x + step * i + step / 2, o.y)
    ctx.lineTo(o.x + step * (i + 1), o.y + o.h)
  }
  ctx.closePath()
  ctx.fillStyle = o.color || '#ff5c7a'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

function drawGoal(ctx, o, time) {
  const pulse = 1 + Math.sin((time || 0) * 3) * 0.06
  const cx = o.x + o.w / 2
  ctx.save()
  ctx.strokeStyle = '#cdf7b0'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(cx - 10, o.y)
  ctx.lineTo(cx - 10, o.y + o.h)
  ctx.stroke()
  ctx.fillStyle = o.color || '#a3ff57'
  ctx.beginPath()
  ctx.moveTo(cx - 10, o.y + 4)
  ctx.lineTo(cx - 10 + 34 * pulse, o.y + 18)
  ctx.lineTo(cx - 10, o.y + 32)
  ctx.closePath()
  ctx.fill()
  const glow = ctx.createRadialGradient(cx, o.y + o.h / 2, 4, cx, o.y + o.h / 2, 70)
  glow.addColorStop(0, 'rgba(163, 255, 87, 0.28)')
  glow.addColorStop(1, 'rgba(163, 255, 87, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(cx - 70, o.y - 40, 140, 140)
  ctx.restore()
}

function drawSpawn(ctx, o) {
  const cx = o.x + o.w / 2
  const cy = o.y + o.h / 2
  ctx.save()
  ctx.strokeStyle = 'rgba(77, 216, 255, 0.9)'
  ctx.lineWidth = 3
  ctx.setLineDash([7, 6])
  ctx.beginPath()
  ctx.ellipse(cx, o.y + o.h - 4, o.w / 2, 10, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(77, 216, 255, 0.16)'
  roundRect(ctx, o.x, o.y, o.w, o.h, 10)
  ctx.fill()
  ctx.fillStyle = '#9fe9ff'
  ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('START', cx, o.y - 8)
  ctx.restore()
}

function drawEnemy(ctx, o) {
  ctx.save()
  roundRect(ctx, o.x, o.y, o.w, o.h, 9)
  ctx.fillStyle = o.color || '#ff8a3d'
  ctx.fill()
  ctx.fillStyle = '#1a0d06'
  const eye = Math.max(3, o.w * 0.11)
  ctx.beginPath()
  ctx.arc(o.x + o.w * 0.34, o.y + o.h * 0.42, eye, 0, Math.PI * 2)
  ctx.arc(o.x + o.w * 0.66, o.y + o.h * 0.42, eye, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(26,13,6,0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(o.x + o.w * 0.34, o.y + o.h * 0.72)
  ctx.lineTo(o.x + o.w * 0.66, o.y + o.h * 0.72)
  ctx.stroke()
  ctx.restore()
}

function drawEntity(ctx, o) {
  ctx.save()
  roundRect(ctx, o.x, o.y, o.w, o.h, 10)
  const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h)
  grad.addColorStop(0, o.color || '#b98bff')
  grad.addColorStop(1, 'rgba(120, 80, 200, 0.85)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `600 ${Math.max(11, Math.min(o.w, o.h) * 0.34)}px ui-monospace, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('{ }', o.x + o.w / 2, o.y + o.h / 2)
  ctx.restore()
}

export function drawPlayer(ctx, p) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.beginPath()
  ctx.ellipse(p.x + p.w / 2, p.y + p.h + 4, p.w * 0.48, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  roundRect(ctx, p.x, p.y, p.w, p.h, 11)
  ctx.fillStyle = '#a3ff57'
  ctx.fill()
  ctx.strokeStyle = 'rgba(8, 18, 10, 0.55)'
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.fillStyle = '#10240f'
  roundRect(ctx, p.x + p.w * 0.18, p.y + p.h * 0.2, p.w * 0.64, p.h * 0.28, 5)
  ctx.fill()

  ctx.fillStyle = '#e9ffe0'
  const dir = p.vx < -1 ? -1 : 1
  ctx.beginPath()
  ctx.arc(p.x + p.w / 2 + dir * p.w * 0.12, p.y + p.h * 0.34, 2.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawObject(ctx, o, time) {
  switch (o.type) {
    case 'platform':
      drawPlatform(ctx, o)
      break
    case 'hazard':
      drawHazard(ctx, o)
      break
    case 'goal':
      drawGoal(ctx, o, time)
      break
    case 'spawn':
      drawSpawn(ctx, o)
      break
    case 'enemy':
      drawEnemy(ctx, o)
      break
    case 'entity':
      drawEntity(ctx, o)
      break
    default:
      break
  }
}

function drawSelection(ctx, o, scale) {
  const pad = 6
  ctx.save()
  ctx.strokeStyle = '#a3ff57'
  ctx.lineWidth = 2 / scale
  ctx.setLineDash([8 / scale, 6 / scale])
  roundRect(ctx, o.x - pad, o.y - pad, o.w + pad * 2, o.h + pad * 2, 10)
  ctx.stroke()
  ctx.restore()
}

function drawDraft(ctx, draft, scale) {
  if (!draft || draft.kind !== 'rect') return
  const x = Math.min(draft.start.x, draft.current.x)
  const y = Math.min(draft.start.y, draft.current.y)
  const w = Math.abs(draft.current.x - draft.start.x)
  const h = Math.abs(draft.current.y - draft.start.y)
  ctx.save()
  ctx.fillStyle = draft.type === 'hazard' ? 'rgba(255, 92, 122, 0.25)' : 'rgba(63, 111, 156, 0.35)'
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = draft.type === 'hazard' ? '#ff5c7a' : '#86d8ff'
  ctx.lineWidth = 2 / scale
  ctx.setLineDash([6 / scale, 5 / scale])
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

function drawGhost(ctx, hover, tool, scale) {
  if (!hover || !['goal', 'spawn', 'enemy', 'entity'].includes(tool)) return
  ctx.save()
  ctx.globalAlpha = 0.45
  ctx.fillStyle = 'rgba(163,255,87,0.5)'
  ctx.strokeStyle = '#a3ff57'
  ctx.lineWidth = 2 / scale
  ctx.setLineDash([5 / scale, 5 / scale])
  ctx.beginPath()
  ctx.arc(hover.x, hover.y, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function drawScene(ctx, scene, opts = {}) {
  const {
    cssW = SCENE_W,
    cssH = SCENE_H,
    mode = 'edit',
    selectedId = null,
    hover = null,
    tool = 'select',
    draft = null,
    runtime = null,
    time = 0,
  } = opts

  const layout = makeLayout(cssW, cssH)

  ctx.save()
  ctx.fillStyle = '#05080d'
  ctx.fillRect(0, 0, cssW, cssH)
  ctx.translate(layout.ox, layout.oy)
  ctx.scale(layout.scale, layout.scale)
  ctx.beginPath()
  ctx.rect(0, 0, SCENE_W, SCENE_H)
  ctx.clip()

  drawBackground(ctx)
  if (mode === 'edit') drawGrid(ctx, layout)

  const objects = runtime ? runtime.objects : scene.objects
  for (const o of objects) {
    if (mode === 'play' && o.type === 'spawn') continue
    drawObject(ctx, o, time)
  }

  if (runtime && mode === 'play') drawPlayer(ctx, runtime.player)

  if (mode === 'edit') {
    const selected = objects.find((o) => o.id === selectedId)
    if (selected) drawSelection(ctx, selected, layout.scale)
    drawDraft(ctx, draft, layout.scale)
    drawGhost(ctx, hover, tool, layout.scale)
  }

  ctx.restore()

  // letterbox frame
  ctx.save()
  ctx.strokeStyle = 'rgba(120, 180, 220, 0.18)'
  ctx.lineWidth = 1
  ctx.strokeRect(layout.ox, layout.oy, SCENE_W * layout.scale, SCENE_H * layout.scale)
  ctx.restore()

  return layout
}
