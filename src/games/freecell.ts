import { Card, Suit } from "../cards";
import { Game, State } from "../game";
import { Depot, CardSprite, Rect } from "../layout";
import { getAlternateSuits, isAlternating } from "./klondike";

const left = 15;
const cardWidth = 59;
const marginX = 11;

export enum FreeCellDepot {
  Cell1,
  Cell2,
  Cell3,
  Cell4,
  Foundation1,
  Foundation2,
  Foundation3,
  Foundation4,
  Tableau1,
  Tableau2,
  Tableau3,
  Tableau4,
  Tableau5,
  Tableau6,
  Tableau7,
  Tableau8,
  Count,
}

export const FreeCell: Game = {
  foundations: () => [
    FreeCellDepot.Foundation1,
    FreeCellDepot.Foundation2,
    FreeCellDepot.Foundation3,
    FreeCellDepot.Foundation4,
  ],

  getAutomaticMoves: function (
    state: { depots: Depot[]; hand: CardSprite[] },
    moveCards: (
      state: { depots: Depot[]; hand: CardSprite[] },
      a: number,
      b: number,
      n: number,
    ) => void,
  ): number[] {
    const nextRanks = [0, 0, 0, 0];
    for (
      let i = FreeCellDepot.Foundation1;
      i <= FreeCellDepot.Foundation4;
      i++
    ) {
      const n = state.depots[i].cards.length;
      if (n > 0) {
        const card = state.depots[i].cards[n - 1];
        nextRanks[card.card.suit] = card.card.rank + 1;
      }
    }

    let results = [0, 0, 0, 0];

    automoveLoop: for (let iterations = 0; iterations < 52; iterations++) {
      let automoveCards = [];
      for (let i = 0; i < 4; i++) {
        const alternates = getAlternateSuits(i);
        const rank = nextRanks[i];

        if (!Card.isRank(rank)) continue;

        if (
          rank <= 1 ||
          (nextRanks[alternates[0]] >= rank && nextRanks[alternates[1]] >= rank)
        ) {
          automoveCards.push(Card.from(i, rank));
        }
      }

      const indices = [
        FreeCellDepot.Cell1,
        FreeCellDepot.Cell2,
        FreeCellDepot.Cell3,
        FreeCellDepot.Cell4,
        FreeCellDepot.Tableau1,
        FreeCellDepot.Tableau2,
        FreeCellDepot.Tableau3,
        FreeCellDepot.Tableau4,
        FreeCellDepot.Tableau5,
        FreeCellDepot.Tableau6,
        FreeCellDepot.Tableau7,
        FreeCellDepot.Tableau8,
      ];

      for (let i = 0; i < indices.length; i++) {
        const a = indices[i];
        const depot = state.depots[a];

        if (depot.cards.length === 0) {
          continue;
        }

        const card = depot.cards[depot.cards.length - 1].card;
        if (card.rank == 0) {
          for (
            let b = FreeCellDepot.Foundation1;
            b <= FreeCellDepot.Foundation4;
            b++
          ) {
            if (state.depots[b].cards.length === 0) {
              nextRanks[card.suit] += 1;
              moveCards(state, a, b, 1);
              results[b - FreeCellDepot.Foundation1] += 1;
              continue automoveLoop;
            }
          }
        } else if (
          automoveCards.some(
            (x) => x.rank === card.rank && x.suit === card.suit,
          )
        ) {
          for (
            let b = FreeCellDepot.Foundation1;
            b <= FreeCellDepot.Foundation4;
            b++
          ) {
            const n = state.depots[b].cards.length;
            if (n > 0) {
              const foundationCard = state.depots[b].cards[n - 1].card;
              if (foundationCard.suit === card.suit) {
                nextRanks[card.suit] += 1;
                moveCards(state, a, b, 1);
                results[b - FreeCellDepot.Foundation1] += 1;
                continue automoveLoop;
              }
            }
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
    // Cells
    for (let i = 0; i < 4; i++) {
      state.depots.push({
        id: state.depots.length,
        rect: Rect.from(left + 70 * i, top, cardWidth, cardHeight),
        type: "cell",
        cards: [],
        visible: true,
      });
    }
    // Foundation
    for (let i = 4; i < 8; i++) {
      state.depots.push({
        id: state.depots.length,
        rect: Rect.from(left + 70 * i, top, cardWidth, cardHeight),
        type: "pile",
        cards: [],
        visible: true,
      });
    }
    // Tableau
    for (let i = 0; i < 8; i++) {
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
    if (n === 0) return false;
    if (a === b) return false;
    if (a >= FreeCellDepot.Foundation1 && a <= FreeCellDepot.Foundation4) {
      return false;
    }

    const depotB = state.depots[b];

    const cards = state.hand;
    const firstCard = cards[0].card;
    const topDepotCard =
      depotB.cards.length === 0
        ? undefined
        : depotB.cards[depotB.cards.length - 1].card;

    if (n === 1) {
      // to cell
      if (b >= FreeCellDepot.Cell1 && b <= FreeCellDepot.Cell4) {
        return !topDepotCard;
      }

      // to foundation
      if (b >= FreeCellDepot.Foundation1 && b <= FreeCellDepot.Foundation4) {
        if (!topDepotCard) return firstCard.rank === 0;
        const isValidRank = firstCard.rank === topDepotCard.rank + 1;
        const isValidSuit = firstCard.suit === topDepotCard.suit;
        return isValidRank && isValidSuit;
      }

      // to tableau
      if (b >= FreeCellDepot.Tableau1 && b <= FreeCellDepot.Tableau8) {
        if (!topDepotCard) return true;
        const isValidRank = firstCard.rank === topDepotCard.rank - 1;
        const isValidSuit = getAlternateSuits(topDepotCard.suit).includes(
          firstCard.suit,
        );
        return isValidRank && isValidSuit;
      }

      return false;
    }

    // n > 1:

    // to tableau
    if (b >= FreeCellDepot.Tableau1 && b <= FreeCellDepot.Tableau8) {
      const freeCellCount = state.depots
        .slice(FreeCellDepot.Cell1, FreeCellDepot.Foundation1)
        .filter(({ cards }) => cards.length === 0).length;

      const freeColumnCount = state.depots
        .slice(FreeCellDepot.Tableau1, FreeCellDepot.Count)
        .filter(({ cards }) => cards.length === 0).length;

      const nMax =
        (freeCellCount + 1) <<
        (topDepotCard === undefined ? freeColumnCount - 1 : freeColumnCount);

      if (n > nMax) return false;

      if (!topDepotCard) return true;

      const isValidRank = firstCard.rank === topDepotCard.rank - 1;
      const isValidSuit = getAlternateSuits(topDepotCard.suit).includes(
        firstCard.suit,
      );

      return isValidRank && isValidSuit;
    }

    return false;
  },

  isValidStart: function (state: State, a: number, n: number): boolean {
    if (a >= FreeCellDepot.Foundation1 && a <= FreeCellDepot.Foundation4)
      return false;

    if (n === 1) return true;

    if (a < FreeCellDepot.Tableau1 || a > FreeCellDepot.Tableau8) return false;

    const depotA = state.depots[a];
    if (depotA.cards.length === 0) return false;

    const freeCellCount = state.depots
      .slice(FreeCellDepot.Cell1, FreeCellDepot.Foundation1)
      .filter(({ cards }) => cards.length === 0).length;

    const freeColumnCount = state.depots
      .slice(FreeCellDepot.Tableau1, FreeCellDepot.Count)
      .filter(({ cards }) => cards.length === 0).length;

    const nMax = (freeCellCount + 1) << freeColumnCount;

    return (
      n <= nMax && isAlternating(depotA.cards.slice(depotA.cards.length - n))
    );
  },

  isWin: (state: State) =>
    state.depots
      .slice(FreeCellDepot.Foundation1, FreeCellDepot.Foundation4 + 1)
      .every((x) => x.cards.length === 13),

  layoutWidth: () => (cardWidth + marginX) * 8 - marginX + 2 * left,
  layoutHeight: () => 535,

  score: function (state: State): number {
    let result = 0;
    for (
      let i = FreeCellDepot.Foundation1;
      i <= FreeCellDepot.Foundation4;
      i++
    ) {
      result += state.depots[i].cards.length;
    }

    return result;
  },

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
      const [hiddenCount, ...cardValues] = split[i];
      state.depots[i].cards = [];
      const [xScale, yScale] = Depot.getOffsetScale(state.depots[i]);
      for (let j = 0; j < hiddenCount; j++) {
        const offset = state.depots[i].cards.length * 20;
        const x = state.depots[i].rect.x + xScale * offset;
        const y = state.depots[i].rect.y + yScale * offset;
        const card = {
          currentX: x,
          currentY: y,
          x,
          y,
          vx: 0,
          vy: 0,
          card: Card.from(Suit.Unknown, 2),
          location: state.depots[i],
        };
        state.depots[i].cards.push(card);
        state.cards.push(card);
      }
      for (let k = 0; k < cardValues.length; k++) {
        const cardValue = cardValues[k];
        const suit = Math.floor(cardValue / 13);
        const rank = Math.floor(cardValue % 13);
        if (Card.isRank(rank)) {
          const card = {
            currentX: state.depots[0].rect.x,
            currentY: state.depots[0].rect.y,
            x: state.depots[i].rect.x,
            y: state.depots[i].rect.y,
            vx: 0,
            vy: 0,
            card: Card.from(suit, rank),
            location: state.depots[i],
          };
          state.depots[i].cards.push(card);
          state.cards.push(card);
        }
      }
    }
  },
};
