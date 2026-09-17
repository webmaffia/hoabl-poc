/** A point at `angleDeg` on an ellipse (rx, ry) centered at (cx, cy) and
 * tilted by `rotDeg` — used to place ring paths, their traveling particles,
 * and the anchored profile nodes on one consistent, pre-tilted coordinate
 * system. */
export function ellipsePoint(cx: number, cy: number, rx: number, ry: number, rotDeg: number, angleDeg: number) {
  const angle = (angleDeg * Math.PI) / 180;
  const rot = (rotDeg * Math.PI) / 180;
  const ex = rx * Math.cos(angle);
  const ey = ry * Math.sin(angle);
  return {
    x: cx + ex * Math.cos(rot) - ey * Math.sin(rot),
    y: cy + ex * Math.sin(rot) + ey * Math.cos(rot),
  };
}
