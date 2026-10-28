// Shape helpers. Shapes are circles or capsules ({kind:'capsule', x1,y1,x2,y2,r}).

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

// Signed distance from a point to the shape's surface (negative inside).
export function signedDistance(shape, x, y) {
  if (shape.kind === 'capsule') {
    return distToSegment(x, y, shape.x1, shape.y1, shape.x2, shape.y2) - shape.r;
  }
  return Math.hypot(x - shape.x, y - shape.y) - shape.r;
}

export function shapeContains(shape, x, y) {
  return signedDistance(shape, x, y) < 0;
}

// Nearest point on a shape's centerline, used to push bodies out of cover.
export function closestPoint(shape, x, y) {
  if (shape.kind !== 'capsule') return { x: shape.x, y: shape.y };
  const dx = shape.x2 - shape.x1;
  const dy = shape.y2 - shape.y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((x - shape.x1) * dx + (y - shape.y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return { x: shape.x1 + dx * t, y: shape.y1 + dy * t };
}

// Push a circle body out of a solid shape.
export function resolveAgainstShape(body, shape) {
  const c = closestPoint(shape, body.x, body.y);
  const dx = body.x - c.x;
  const dy = body.y - c.y;
  const d = Math.hypot(dx, dy);
  const min = shape.r + body.radius;
  if (d >= min) return;
  const nx = d > 0.001 ? dx / d : 1;
  const ny = d > 0.001 ? dy / d : 0;
  body.x = c.x + nx * min;
  body.y = c.y + ny * min;
}

export function drawShape(ctx, shape, fill, stroke) {
  ctx.beginPath();
  if (shape.kind === 'capsule') {
    const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
    ctx.lineWidth = shape.r * 2;
    ctx.lineCap = 'round';
    if (fill) {
      ctx.strokeStyle = fill;
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = shape.r * 2 + 3;
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      ctx.strokeStyle = fill;
      ctx.lineWidth = shape.r * 2;
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
    }
    void angle;
    return;
  }
  ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

export function randomInArena(map, margin = 120) {
  return {
    x: margin + Math.random() * (map.w - margin * 2),
    y: margin + Math.random() * (map.h - margin * 2),
  };
}
