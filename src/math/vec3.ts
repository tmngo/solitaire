import { Mat3 } from "./mat3";

export type Vec3 = [number, number, number];

export const from = (x: number, y: number, z: number): Vec3 => [x, y, z];

export const add = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

export const scale = (v: Vec3, a: number): Vec3 => [
  v[0] * a,
  v[1] * a,
  v[2] * a,
];

export const dot = (a: Vec3, b: Vec3) =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const transform = (m: Mat3, v: Vec3): Vec3 => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
];

export const rotate = (v: Vec3, origin: Vec3, rad: number) => {
  const p0 = v[0] - origin[0];
  const p1 = v[1] - origin[1];
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  return [p0 * c - p1 * s + origin[0], p0 * s + p1 * c + origin[1]];
};

export const rotateAxisAngle = (
  v: Vec3,
  origin: Vec3,
  axis: Vec3,
  rad: number,
) => {
  const u = axis;
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  const d = 1 - c;
  return add(
    transform(
      [
        u[0] * u[0] * d + c,
        u[0] * u[1] * d - u[2] * s,
        u[0] * u[2] * d + u[1] * s,
        //
        u[0] * u[1] * d + u[2] * s,
        u[1] * u[1] * d + c,
        u[1] * u[2] * d - u[0] * s,
        //
        u[0] * u[2] * d - u[1] * s,
        u[1] * u[2] * d + u[0] * s,
        u[2] * u[2] * d + c,
      ],
      add(v, scale(origin, -1)),
    ),
    origin,
  );
};

export const Vec3 = {
  from,
  add,
  dot,
  transform,
  rotate,
  rotateAxisAngle,
};
