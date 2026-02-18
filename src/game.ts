import { Card } from "./cards";
import { CardSprite, Depot, Point2D } from "./layout";

export enum Solitaire {
  Calculation,
  Klondike,
  Sawayama,
}

export interface SolitaireOptions {
  draw?: number;
  faceUp?: boolean;
}

export interface Game {
  foundations: () => number[];
  getAutomaticMoves: (
    state: { depots: Depot[]; hand: CardSprite[] },
    moveCards: (
      state: { depots: Depot[]; hand: CardSprite[] },
      a: number,
      b: number,
      n: number,
    ) => void,
  ) => number[];
  initDepots: (
    state: State,
    left: number,
    top: number,
    cardWidth: number,
    cardHeight: number,
  ) => void;
  isRestockValid: () => boolean;
  isStockEmpty: (state: State) => boolean;
  isValidMove: (state: State, a: number, b: number, n: number) => boolean;
  isValidStart: (state: State, a: number, n: number) => boolean;
  isWin: (state: State) => boolean;
  layoutHeight: () => number;
  layoutWidth: () => number;
  score: (state: State) => number;
  parseMove: (
    state: { depots: Depot[] },
    a: number,
    b: number,
    n: number,
  ) => readonly [boolean, number, number, number];
  setState: (
    state: {
      cards: CardSprite[];
      depots: Depot[];
      lastMove?: { a: number; b: number; n: number };
      moves: { a: number; b: number; n: number }[];
    },
    data: string[],
  ) => void;
}

export type State = {
  // Tracks absolute order of cards for rendering
  cards: CardSprite[];
  // Tracks card locations for game rules
  depots: Depot[];
  hand: CardSprite[];
  selection: {
    a?: number;
    n?: number;
    aTop: number;
    card?: Card;
    offset: Point2D;
    position?: Point2D;
  };
  hovered: number;
  lastMove?: {
    a: number;
    b: number;
    n: number;
  };
  hoveredCard: number;
  rank: string;
  moves: { a: number; b: number; n: number }[];
};
