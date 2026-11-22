// All coordinates accepted/returned here are world coordinates; exclusions
// are tested in CSS pixels, matching the real HUD and enemy's visible radius.
export function safeSpawn(spec, r, view, player, enemies, upperOnly = false) {
  if (!view) return { x: spec.x, y: spec.y };
  const s = view.scale || 1,
    W = view.width || view.w * s,
    H = view.height || view.h * s;
  const gutter = view.hudGutter ?? 20,
    top = view.hudTop ?? 32,
    cw = Math.min(W * 0.34, 300),
    ch = top + 230,
    rad = r * s + 28;
  const boxes = [
    [0, 0, gutter + cw, ch],
    [W - gutter - cw, 0, W, ch],
    [W - gutter - cw, H - top - 230, W, H],
  ];
  const valid = (x, y) => {
    if (
      x < rad ||
      x > W - rad ||
      y < rad ||
      y > (upperOnly ? H * 0.6 : H - rad)
    )
      return false;
    if (
      boxes.some(
        (b) =>
          x + r * s > b[0] &&
          x - r * s < b[2] &&
          y + r * s > b[1] &&
          y - r * s < b[3],
      )
    )
      return false;
    const wx = view.x + x / s,
      wy = view.y + y / s;
    if (Math.hypot(wx - player.x, wy - player.y) * s < 180) return false;
    for (const e of enemies)
      if (
        e.id !== spec.id &&
        Math.hypot(wx - e.x, wy - e.y) * s <
          Math.max(90, (r + (e.r || 30)) * s + 16)
      )
        return false;
    return { x: wx, y: wy };
  };
  const wanted = valid((spec.x - view.x) * s, (spec.y - view.y) * s);
  if (wanted) return wanted;
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++) {
      const q = valid(
        rad + ((W - 2 * rad) * col) / 8,
        rad + ((H - 2 * rad) * row) / 8,
      );
      if (q) return q;
    }
  return null;
}
export function inViewport(e, v, pad = 0) {
  return (
    e.x >= v.x - pad &&
    e.x <= v.x + v.w + pad &&
    e.y >= v.y - pad &&
    e.y <= v.y + v.h + pad
  );
}
