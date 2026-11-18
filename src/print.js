import { cube, cutFigure, line, shearInk } from './art.js';
import { TYPES, INK } from './shapes.js';

// A contact print, not eight generic discovery badges. Lay the actual strike
// onto a strip of paper with its long axis to the right. A dashed path
// connects direct contacts; the ink blade denotes the real forward query.
export function drawStrokePrint(canvas, stroke) {
  const c = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height;
  c.clearRect(0, 0, w, h);
  const ends = stroke.shear ? [...stroke.marks, stroke.shear.end] : stroke.marks;
  const range = (p) => Math.hypot(p.x - stroke.origin.x, p.y - stroke.origin.y),
    far = ends.reduce((a, b) => (range(a) > range(b) ? a : b)),
    bearing = Math.atan2(far.y - stroke.origin.y, far.x - stroke.origin.x),
    ca = Math.cos(bearing),
    sa = Math.sin(bearing);
  function local(p) {
    const x = p.x - stroke.origin.x,
      y = p.y - stroke.origin.y;
    return { x: x * ca + y * sa, y: y * ca - x * sa };
  }
  const marks = stroke.marks.map((m) => ({ ...m, ...local(m) }));
  const bounds = [{ x: 0, y: 0, r: 23 }, ...marks];
  if (stroke.shear) bounds.push({ ...local(stroke.shear.end), r: 9 });
  const minX = Math.min(...bounds.map((m) => m.x - m.r)),
    maxX = Math.max(...bounds.map((m) => m.x + m.r)),
    minY = Math.min(...bounds.map((m) => m.y - m.r)),
    maxY = Math.max(...bounds.map((m) => m.y + m.r)),
    scale = Math.min((w - 44) / (maxX - minX), (h - 18) / (maxY - minY), 1.5),
    ox = (w - (maxX - minX) * scale) / 2 - minX * scale,
    oy = (h - (maxY - minY) * scale) / 2 - minY * scale;
  c.save();
  c.translate(ox, oy);
  c.scale(scale, scale);
  c.setLineDash([8 / scale, 5 / scale]);
  let prev = { x: 0, y: 0 };
  for (const m of marks)
    if (!m.fromShear) {
      line(c, '#7d5f64', 1.7 / scale, prev.x, prev.y, m.x, m.y);
      prev = m;
    }
  c.setLineDash([]);
  if (stroke.shear) {
    const a = local(stroke.shear),
      b = local(stroke.shear.end);
    line(c, INK.black, 9 / scale, a.x, a.y, b.x, b.y);
    shearInk(
      c,
      a.x,
      a.y,
      stroke.shear.angle - bearing,
      Math.hypot(b.x - a.x, b.y - a.y),
      8 / scale,
    );
  }
  cube(c, 0, 0, Math.min(20, 14 / scale), stroke.angle - bearing);
  for (const m of marks)
    cutFigure(c, m.kind, m.x, m.y, m.r * 0.78, m.angle - bearing, m.cut - bearing, m.r * 0.14, {
      paper: m.paper,
      torn: m.release || m.fromShear,
      hp: m.hpBefore,
      fault: m.fault,
      twist: 0.045,
    });
  c.restore();
  const types = stroke.marks.map(
    (m) =>
      `${m.paper ? 'paper triangle' : (m.small ? 'small ' : '') + TYPES[m.kind].name}${m.fromShear ? ' (forward cut)' : ''}`,
  );
  canvas.setAttribute(
    'aria-label',
    `Stroke ${stroke.shot}: ${types.join(', ')}${stroke.kills > marks.length ? ', and more' : ''}. ${stroke.points} points.`,
  );
}
