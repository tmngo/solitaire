import { Card } from "../cards";
import { Game } from "../game";
import { CardSprite, Depot, Rect } from "../layout";
import {
  getAlternateSuits,
  isAlternating,
  Klondike,
  KlondikeDepot,
} from "./klondike";

export type SawayamaDepot = KlondikeDepot;

const isRestockValid = () => false;
const isStockEmpty = (state: { depots: Depot[] }) =>
  state.depots[KlondikeDepot.Stock].cards.length <= 1;
//  ||
// state.depots[KlondikeDepot.Stock].cards[0].card.suit !== Suit.Unknown;

const initDepots = (
  state: { depots: Depot[] },
  left: number,
  top: number,
  cardWidth: number,
  cardHeight: number,
) => {
  state.depots = [];
  state.depots.push(
    // Stock
    {
      id: 0,
      rect: Rect.from(left, top, cardWidth, cardHeight),
      type: "row",
      cards: [],
      visible: true,
    },
    // Wastepile
    {
      id: 1,
      rect: Rect.from(left + 70 * 6, top, cardWidth, cardHeight),
      type: "row-reverse",
      cards: [],
      visible: false,
    },
  );
  // Foundation
  for (let i = 0; i < 4; i++) {
    state.depots.push({
      id: state.depots.length,
      rect: Rect.from(left + 70 * i, top + 90, cardWidth, cardHeight),
      type: "pile",
      cards: [],
      visible: true,
    });
  }
  // Tableau
  for (let i = 0; i < 7; i++) {
    state.depots.push({
      id: state.depots.length,
      rect: Rect.from(left + 70 * i, top + 180, cardWidth, cardHeight),
      type: "column",
      cards: [],
      visible: true,
    });
  }
};

const isValidStart = (state: { depots: Depot[] }, a: number, n: number) => {
  const depotA = state.depots[a];
  if (a === KlondikeDepot.Stock) {
    return (
      n === 1 &&
      (depotA.cards.length > 0 ||
        state.depots[KlondikeDepot.Waste].cards.length > 0)
    );
  }
  if (depotA.cards.length === 0) {
    return false;
  }
  if (a === KlondikeDepot.Waste) {
    return n === 1;
  }
  if (a >= KlondikeDepot.Foundation1 && a <= KlondikeDepot.Foundation4) {
    return false;
  }
  if (a >= KlondikeDepot.Tableau1 && a <= KlondikeDepot.Tableau7) {
    return isAlternating(depotA.cards.slice(depotA.cards.length - n));
  }
  return false;
};

const isValidMove = (
  state: { depots: Depot[]; hand: CardSprite[] },
  a: number,
  b: number,
  n: number,
) => {
  if (n === 0) return false;
  if (a === b) return false;
  const depotA = state.depots[a];
  const depotB = state.depots[b];

  // stock to waste
  if (a === KlondikeDepot.Stock && b === KlondikeDepot.Waste) {
    return n <= depotA.cards.length && depotA.cards.length > 1;
  }
  // waste to stock
  // if (a === KlondikeDepot.Waste && b === KlondikeDepot.Stock) {
  //   return n === depotA.cards.length;
  // }

  if (a === KlondikeDepot.Stock && b !== KlondikeDepot.Waste) {
    if (n !== 1) return false;
  }

  const cards = state.hand;
  const firstCard = cards[0].card;
  const topDepotCard =
    depotB.cards.length === 0
      ? undefined
      : depotB.cards[depotB.cards.length - 1].card;

  if (n === 1) {
    // to foundation
    if (b >= KlondikeDepot.Foundation1 && b <= KlondikeDepot.Foundation4) {
      if (!topDepotCard) return firstCard.rank === 0;
      const isValidRank = firstCard.rank === topDepotCard.rank + 1;
      const isValidSuit = firstCard.suit === topDepotCard.suit;
      return isValidRank && isValidSuit;
    }
    // to tableau
    if (b >= KlondikeDepot.Tableau1 && b <= KlondikeDepot.Tableau7) {
      if (!topDepotCard) return true;
      const isValidRank = firstCard.rank === topDepotCard.rank - 1;
      const isValidSuit = getAlternateSuits(topDepotCard.suit).includes(
        firstCard.suit,
      );
      return isValidRank && isValidSuit;
    }
    // to stock cell
    if (b === KlondikeDepot.Stock && depotB.cards.length === 0) {
      return true;
    }
    return false;
  }

  if (a === KlondikeDepot.Stock || a === KlondikeDepot.Waste) return false;
  if (b === KlondikeDepot.Stock || b === KlondikeDepot.Waste) return false;
  if (!isAlternating(cards)) return false;

  // to tableau
  if (b >= KlondikeDepot.Tableau1 && b <= KlondikeDepot.Tableau7) {
    if (!topDepotCard) return true;
    const isValidRank = firstCard.rank === topDepotCard.rank - 1;
    const isValidSuit = getAlternateSuits(topDepotCard.suit).includes(
      firstCard.suit,
    );
    return isValidRank && isValidSuit;
  }

  return false;
};

const getAutomaticMoves = (
  state: { depots: Depot[]; hand: CardSprite[] },
  moveCards: (
    state: { depots: Depot[]; hand: CardSprite[] },
    a: number,
    b: number,
    n: number,
  ) => void,
) => {
  const nextRanks = [0, 0, 0, 0];
  for (let i = KlondikeDepot.Foundation1; i <= KlondikeDepot.Foundation4; i++) {
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
      KlondikeDepot.Waste,
      KlondikeDepot.Tableau1,
      KlondikeDepot.Tableau2,
      KlondikeDepot.Tableau3,
      KlondikeDepot.Tableau4,
      KlondikeDepot.Tableau5,
      KlondikeDepot.Tableau6,
      KlondikeDepot.Tableau7,
    ];
    if (state.depots[KlondikeDepot.Stock].cards.length === 1) {
      indices.push(KlondikeDepot.Stock);
    }

    for (let i = 0; i < indices.length; i++) {
      const a = indices[i];
      const depot = state.depots[a];

      if (depot.cards.length === 0) {
        continue;
      }

      const card = depot.cards[depot.cards.length - 1].card;
      if (card.rank == 0) {
        for (
          let b = KlondikeDepot.Foundation1;
          b <= KlondikeDepot.Foundation4;
          b++
        ) {
          if (state.depots[b].cards.length === 0) {
            nextRanks[card.suit] += 1;
            moveCards(state, a, b, 1);
            // console.log("automove", a, b);
            results[b - KlondikeDepot.Foundation1] += 1;
            continue automoveLoop;
          }
        }
      } else if (
        automoveCards.some((x) => x.rank === card.rank && x.suit === card.suit)
      ) {
        for (
          let b = KlondikeDepot.Foundation1;
          b <= KlondikeDepot.Foundation4;
          b++
        ) {
          const n = state.depots[b].cards.length;
          if (n > 0) {
            const foundationCard = state.depots[b].cards[n - 1].card;
            if (foundationCard.suit === card.suit) {
              nextRanks[card.suit] += 1;
              moveCards(state, a, b, 1);
              // console.log("automove", a, b);
              results[b - KlondikeDepot.Foundation1] += 1;
              continue automoveLoop;
            }
          }
        }
      }
    }

    break;
  }

  return results;
};

const parseMove = (
  state: { depots: Depot[] },
  a: number,
  b: number,
  n: number,
) => {
  const depotA = state.depots[a];
  if (
    a === KlondikeDepot.Stock &&
    b === KlondikeDepot.Stock &&
    n === 3 &&
    depotA.cards.length > 1
  ) {
    return [
      true,
      a,
      KlondikeDepot.Waste,
      Math.min(depotA.cards.length, 3),
    ] as const;
  }

  return [true, a, b, n] as const;
};

export const Sawayama: Game = {
  ...Klondike,
  parseMove,
  getAutomaticMoves,
  isStockEmpty,
  isRestockValid,
  initDepots,
  isValidMove,
  isValidStart,
};
