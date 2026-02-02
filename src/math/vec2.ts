import { Mat2 } from "./mat2";

export type Vec2 = [number, number];

export const from = (x: number, y: number): Vec2 => [x, y];

export const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];

export const dot = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1];

export const transform = (m: Mat2, v: Vec2) => [
  m[0] * v[0] + m[2] * v[1],
  m[1] * v[0] + m[3] * v[1],
];

export const rotate = (v: Vec2, origin: Vec2, rad: number) => {
  const p0 = v[0] - origin[0];
  const p1 = v[1] - origin[1];
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  return [p0 * c - p1 * s + origin[0], p0 * s + p1 * c + origin[1]];
};

export const Vec2 = {
  from,
  add,
  dot,
  transform,
  rotate,
};
