export interface Game {
  foundations: number[][];
  tableau: number[][];
  stock: number[];
}

export enum Solitaire {
  Calculation,
  Klondike,
  Sawayama,
}

export interface SolitaireOptions {
  draw?: number;
  faceUp?: boolean;
}
