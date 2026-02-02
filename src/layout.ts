import { Card } from "./cards";
import { Vec2 } from "./math/vec2";

export type Point2D = {
  x: number;
  y: number;
};

const add = (a: Point2D, b: Point2D) => ({ x: a.x + b.x, y: a.y + b.y });

export const Point2D = {
  add,
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const from = (x: number, y: number, w: number, h: number): Rect => ({
  x,
  y,
  w,
  h,
});

const hasPoint = (point: Point2D, rect: Rect) =>
  point.x >= rect.x &&
  point.x <= rect.x + rect.w &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.h;

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.w;

export const Rect = {
  from,
  hasPoint,
  intersects,
};

export type CardSprite = {
  currentX: number;
  currentY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  card: Card;
  location: Depot;
  visible?: boolean;
};

type DepotType = "column" | "pile" | "row";
// depot    position in the layout comprising a pile
// column   vertical spread line of cards
// row      horizontal spread line of cards
// pile     stack of cards (not spread)

export type Depot = {
  id: number;
  rect: Rect;
  type: DepotType;
  cards: CardSprite[];
};

const PER_CARD_OFFSET = 20;

const getOffsetScale = (depot: Depot) => {
  const xScale = depot.type === "row" ? 0.75 : 0;
  const yScale = depot.type === "column" ? 1 : 0;
  return [xScale, yScale] as const;
};

const getTopOffset = (depot: Depot) => {
  if (depot.type === "column") {
    return { x: 0, y: depot.cards.length * PER_CARD_OFFSET };
  } else if (depot.type === "row") {
    return { x: depot.cards.length * PER_CARD_OFFSET, y: 0 };
  } else {
    return { x: 0, y: 0 };
  }
};

export const Depot = {
  getTopOffset,
  getOffsetScale,
};
