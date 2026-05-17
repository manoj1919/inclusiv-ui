/** Tiny helpers shared by all SVG charts. Charts are server-rendered. */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(t: number, a: number, b: number): number {
  return a + (b - a) * t;
}

/** Map domain → pixel x. Inputs may be outside [domainMin,domainMax]; clamps. */
export function scale(value: number, domainMin: number, domainMax: number, pxMin: number, pxMax: number): number {
  if (domainMax === domainMin) return pxMin;
  const t = (value - domainMin) / (domainMax - domainMin);
  return lerp(clamp(t, 0, 1), pxMin, pxMax);
}
