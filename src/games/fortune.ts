import { Card } from "../cards";
import { Game, State } from "../game";
import { Depot, CardSprite, Rect } from "../layout";

const left = 15;
const cardWidth = 59;
const marginX = 11;

const FOUNDATIONS = [0, 1, 2, 3, 4, 5];
const CELL = 6;
const TABLEAU = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

const score = (state: State): number => {
  let result = 0;
  for (let i = FOUNDATIONS[0]; i <= FOUNDATIONS[5]; i++) {
    result += state.depots[i].cards.length;
  }

  return result;
};

export const Fortune: Game = {
  instructions: () =>
    `To win, move all cards to the foundations. The major arcana are built up from 0 or down from 21, and the standard suits are built up from A to K.
  
  Only one card can be moved at a time. Cards of the same suit may be stacked in ascending or descending order.
  
  A card may be placed in the free cell at the top, but will block cards from being added to the standard suit foundations.`,

  foundations: () => FOUNDATIONS,

  getAutomaticMoves: function (
    state: { depots: Depot[]; hand: CardSprite[] },
    moveCards: (
      state: { depots: Depot[]; hand: CardSprite[] },
      a: number,
      b: number,
      n: number,
    ) => void,
  ): number[] {
    const cardsToMove: Card[] = [
      { suit: 4, rank: state.depots[FOUNDATIONS[0]].cards.length },
      { suit: 4, rank: 21 - state.depots[FOUNDATIONS[1]].cards.length },
      { suit: 0, rank: state.depots[FOUNDATIONS[2]].cards.length },
      { suit: 1, rank: state.depots[FOUNDATIONS[3]].cards.length },
      { suit: 2, rank: state.depots[FOUNDATIONS[4]].cards.length },
      { suit: 3, rank: state.depots[FOUNDATIONS[5]].cards.length },
    ];

    let results = [0, 0, 0, 0, 0, 0];

    automoveLoop: for (let iterations = 0; iterations < 70; iterations++) {
      const isCellEmpty = state.depots[CELL].cards.length === 0;

      const indices = [
        CELL,
        TABLEAU[0],
        TABLEAU[1],
        TABLEAU[2],
        TABLEAU[3],
        TABLEAU[4],
        TABLEAU[5],
        TABLEAU[6],
        TABLEAU[7],
        TABLEAU[8],
        TABLEAU[9],
        TABLEAU[10],
      ];

      const targetCount = isCellEmpty ? 6 : 2;

      for (let i = 0; i < indices.length; i++) {
        const a = indices[i];
        const depot = state.depots[a];

        if (depot.cards.length === 0) {
          continue;
        }

        const card = depot.cards[depot.cards.length - 1].card;

        for (let j = 0; j < targetCount; j++) {
          const automoveCard = cardsToMove[j];

          if (Card.compareCards(card, automoveCard) === 0) {
            moveCards(state, a, FOUNDATIONS[j], 1);
            results[j] += 1;
            if (j === 1) {
              cardsToMove[j].rank -= 1;
            } else {
              cardsToMove[j].rank += 1;
            }
            continue automoveLoop;
          }
        }
      }

      break;
    }

    return results;
  },

  initDepots: function (
    state: State,
    left: number,
    top: number,
    cardWidth: number,
    cardHeight: number,
  ): void {
    state.depots = [];

    // Foundation
    for (let i = 0; i < 2; i++) {
      state.depots.push({
        id: state.depots.length,
        rect: Rect.from(left + 70 * i, top, cardWidth, cardHeight),
        type: "pile",
        cards: [],
        visible: true,
      });
    }

    for (let i = 2; i < 6; i++) {
      state.depots.push({
        id: state.depots.length,
        rect: Rect.from(left + 70 * (5 + i), top, cardWidth, cardHeight),
        type: "pile",
        cards: [],
        visible: true,
      });
    }

    // Cells
    state.depots.push({
      id: state.depots.length,
      rect: Rect.from(left + 70 * 5, top, cardWidth, cardHeight),
      type: "cell",
      cards: [],
      visible: true,
    });

    // Tableau
    for (let i = 0; i < 11; i++) {
      state.depots.push({
        id: state.depots.length,
        rect: Rect.from(left + 70 * i, top + 90, cardWidth, cardHeight),
        type: "column",
        cards: [],
        visible: true,
      });
    }
  },

  isRestockValid: () => false,

  isStockEmpty: () => true,

  isValidMove: function (
    state: State,
    a: number,
    b: number,
    n: number,
  ): boolean {
    if (n !== 1) return false;
    if (a === b) return false;
    if (a >= FOUNDATIONS[0] && a <= FOUNDATIONS[5]) {
      return false;
    }

    const depotB = state.depots[b];

    const cards = state.hand;
    const firstCard = cards[0].card;
    const topDepotCard =
      depotB.cards.length === 0
        ? undefined
        : depotB.cards[depotB.cards.length - 1].card;
    const isCellEmpty = state.depots[CELL].cards.length === 0;

    // to cell
    if (b === CELL) {
      return isCellEmpty;
    }

    // to major arcana foundation
    if (b === FOUNDATIONS[0]) {
      if (!topDepotCard) return firstCard.suit === 4 && firstCard.rank === 0;
      const isValidRank = firstCard.rank === topDepotCard.rank + 1;
      const isValidSuit = firstCard.suit === topDepotCard.suit;
      return isValidRank && isValidSuit;
    }

    if (b === FOUNDATIONS[1]) {
      if (!topDepotCard) return firstCard.suit === 4 && firstCard.rank === 21;
      const isValidRank = firstCard.rank === topDepotCard.rank - 1;
      const isValidSuit = firstCard.suit === topDepotCard.suit;
      return isValidRank && isValidSuit;
    }

    // to minor arcana foundation
    if (b >= FOUNDATIONS[2] && b <= FOUNDATIONS[5]) {
      if (!isCellEmpty) return false;
      if (!topDepotCard) return firstCard.rank !== 4 && firstCard.rank === 0;
      const isValidRank = firstCard.rank === topDepotCard.rank + 1;
      const isValidSuit = firstCard.suit === topDepotCard.suit;
      console.log(isValidRank, isValidSuit);
      return isValidRank && isValidSuit;
    }

    // to tableau
    if (b >= TABLEAU[0] && b <= TABLEAU[10]) {
      if (!topDepotCard) return true;
      const isValidRank =
        firstCard.rank === topDepotCard.rank - 1 ||
        firstCard.rank === topDepotCard.rank + 1;
      const isValidSuit = firstCard.suit === topDepotCard.suit;
      return isValidRank && isValidSuit;
    }

    return false;
  },

  isValidStart: function (_state: State, a: number, n: number): boolean {
    if (a >= FOUNDATIONS[0] && a <= FOUNDATIONS[5]) return false;

    return n === 1;
  },

  isWin: (state: State) => score(state) === 74,

  layoutWidth: () => (cardWidth + marginX) * 11 - marginX + 2 * left,
  layoutHeight: () => 535,

  score: score,

  parseMove: function (
    _state: { depots: Depot[] },
    a: number,
    b: number,
    n: number,
  ): readonly [boolean, number, number, number] {
    return [true, a, b, n];
  },

  setState: function (
    state: {
      cards: CardSprite[];
      depots: Depot[];
      lastMove?: { a: number; b: number; n: number };
      moves: { a: number; b: number; n: number }[];
    },
    data: string[],
  ): void {
    state.cards = [];
    state.moves = [];

    const split = data.map((x) => {
      const bytes = new Uint8Array(x.length);
      for (let i = 0; i < x.length; i++) {
        bytes[i] = x.charCodeAt(i) - 65;
      }
      return bytes;
    });

    for (let i = 0; i < split.length; i++) {
      const [_, ...cardValues] = split[i];
      state.depots[i].cards = [];

      for (let k = 0; k < cardValues.length; k++) {
        const cardValue = cardValues[k];
        const suit = Math.floor(cardValue / 22);
        const rank = Math.floor(cardValue % 22);
        const card = {
          currentX: state.depots[0].rect.x,
          currentY: state.depots[0].rect.y,
          x: state.depots[i].rect.x,
          y: state.depots[i].rect.y,
          vx: 0,
          vy: 0,
          card: Card.from(suit, rank),
        };
        state.depots[i].cards.push(card);
        state.cards.push(card);
      }
    }
  },
};
