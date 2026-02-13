import { Card, Suit } from "../cards";
import { Game, State } from "../game";
import { CardSprite, Depot, Rect } from "../layout";

export enum KlondikeDepot {
  Stock,
  Waste,
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
}

export const getAlternateSuits = (suit: Suit) =>
  suit === Suit.Clubs || suit == Suit.Spades
    ? [Suit.Diamonds, Suit.Hearts]
    : [Suit.Clubs, Suit.Spades];

export const isAlternating = (cards: CardSprite[]) => {
  if (cards.length <= 1) return true;
  const alternates0 = getAlternateSuits(cards[0].card.suit);
  const alternates1 = getAlternateSuits(cards[1].card.suit);
  if (!alternates0.includes(cards[1].card.suit)) return false;
  for (let i = 1; i < cards.length; i += 1) {
    if (cards[i - 1].card.rank - cards[i].card.rank !== 1) return false;
  }
  for (let i = 0; i < cards.length; i += 2) {
    if (alternates0.includes(cards[i].card.suit)) return false;
  }
  for (let i = 1; i < cards.length; i += 2) {
    if (alternates1.includes(cards[i].card.suit)) return false;
  }
  return true;
};

const initDepots = (
  state: { depots: Depot[] },
  left: number,
  top: number,
  cardWidth: number,
  cardHeight: number,
) => {
  state.depots.push(
    // Stock
    {
      id: 0,
      rect: Rect.from(left, top, cardWidth, cardHeight),
      type: "pile",
      cards: [],
      visible: true,
    },
    // Wastepile
    {
      id: 1,
      rect: Rect.from(left + 70, top, cardWidth, cardHeight),
      type: "row",
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

// @ts-expect-error
const isValidDraw = (state: { depots: Depot[] }, a: number, n: number) => {
  const depotA = state.depots[a];
  if (a === KlondikeDepot.Stock) {
    return (
      depotA.cards.length > 0 ||
      state.depots[KlondikeDepot.Waste].cards.length > 0
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
    console.log(depotA.cards.length);
    return isAlternating(depotA.cards.slice(depotA.cards.length - n));
  }
  return false;
};

const isValidStart = (state: { depots: Depot[] }, a: number, n: number) => {
  const depotA = state.depots[a];
  if (a === KlondikeDepot.Stock) {
    return (
      depotA.cards.length > 0 ||
      state.depots[KlondikeDepot.Waste].cards.length > 0
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
    console.log(depotA.cards.length);
    return isAlternating(depotA.cards.slice(depotA.cards.length - n));
  }
  return false;
};

const isValidMove = (
  state: { depots: Depot[] },
  a: number,
  b: number,
  n: number,
) => {
  if (n === 0) return false;
  const depotA = state.depots[a];
  const depotB = state.depots[b];

  // stock to waste
  if (a === KlondikeDepot.Stock && b === KlondikeDepot.Waste) {
    return n <= depotA.cards.length;
  }
  // waste to stock
  if (a === KlondikeDepot.Waste && b === KlondikeDepot.Stock) {
    return n === depotA.cards.length;
  }

  const cards = depotA.cards.slice(-n);
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
      if (!topDepotCard) return firstCard.rank === 12;
      const isValidRank = firstCard.rank === topDepotCard.rank - 1;
      const isValidSuit = getAlternateSuits(topDepotCard.suit).includes(
        firstCard.suit,
      );
      return isValidRank && isValidSuit;
    }

    return false;
  }

  if (a === KlondikeDepot.Stock || a === KlondikeDepot.Waste) return false;
  if (b === KlondikeDepot.Stock || b === KlondikeDepot.Waste) return false;
  if (!isAlternating(cards)) return false;

  // to tableau
  if (b >= KlondikeDepot.Tableau1 && b <= KlondikeDepot.Tableau7) {
    if (!topDepotCard) return firstCard.rank === 12;
    const isValidRank = firstCard.rank === topDepotCard.rank - 1;
    const isValidSuit = getAlternateSuits(topDepotCard.suit).includes(
      firstCard.suit,
    );
    return isValidRank && isValidSuit;
  }
  return false;
};

const parseMove = (
  state: { depots: Depot[] },
  a: number,
  b: number,
  n: number,
) => {
  const depotA = state.depots[a];
  if (a === KlondikeDepot.Stock) {
    if (a === b) {
      b = KlondikeDepot.Waste;
      n = Math.min(depotA.cards.length, 3);
      if (depotA.cards.length === 0) {
        a = KlondikeDepot.Waste;
        b = KlondikeDepot.Stock;
        n = state.depots[b].cards.length;
      }
      return [true, a, b, n] as const;
    }
  }
  return [true, a, b, n] as const;
};

const setState = (
  state: {
    cards: CardSprite[];
    depots: Depot[];
    lastMove?: { a: number; b: number; n: number };
    moves: { a: number; b: number; n: number }[];
  },
  data: string,
) => {
  const split = data
    .substring(5)
    .split(" ")
    .map((x) => {
      const binaryString = atob(x);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    });
  state.cards = [];
  state.moves = [];
  console.log(split);
  console.log(state.lastMove);

  for (let i = 0; i < split.length; i++) {
    const hiddenCount = split[i][0];
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
    for (let k = 1; k < split[i].length; k++) {
      const cardValue = split[i][k];
      const suit = Math.floor(split[i][k] / 13);
      const rank = Math.floor(cardValue % 13);
      if (Card.isRank(rank)) {
        const offset = state.depots[i].cards.length * 20;
        const x = state.depots[i].rect.x + xScale * offset;
        const y = state.depots[i].rect.y + yScale * offset;
        // Animate from stock if drawn
        const currentX =
          i === KlondikeDepot.Waste &&
          state.lastMove?.b === KlondikeDepot.Waste &&
          k >= split[i].length - (state.lastMove?.n ?? 0)
            ? state.depots[KlondikeDepot.Stock].rect.x
            : x;
        const currentY =
          i === KlondikeDepot.Waste &&
          state.lastMove?.b === KlondikeDepot.Waste &&
          k >= split[i].length - (state.lastMove?.n ?? 0)
            ? state.depots[KlondikeDepot.Stock].rect.y
            : y;
        const card = {
          currentX,
          currentY,
          x,
          y,
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
  // const hiddenCount = split[0][0];
  // state.depots[0].cards = [];
  // const [xScale, yScale] = Depot.getOffsetScale(state.depots[0]);
  // for (let j = 0; j < hiddenCount; j++) {
  //   const offset = state.depots[0].cards.length * 20;
  //   const x = state.depots[0].rect.x + xScale * offset;
  //   const y = state.depots[0].rect.y + yScale * offset;
  //   const card = {
  //     currentX: x,
  //     currentY: y,
  //     x,
  //     y,
  //     card: Card.from(Suit.Unknown, 2),
  //     location: state.depots[0],
  //   };
  //   state.depots[0].cards.push(card);
  //   state.cards.push(card);
  // }
};

const setState2 = (
  state: {
    cards: CardSprite[];
    depots: Depot[];
    lastMove?: { a: number; b: number; n: number };
    moves: { a: number; b: number; n: number }[];
  },
  data: string[],
) => {
  const split = data.map((x) => {
    const bytes = new Uint8Array(x.length);
    for (let i = 0; i < x.length; i++) {
      bytes[i] = x.charCodeAt(i) - 65;
    }
    return bytes;
  });
  state.cards = [];
  state.moves = [];

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
        // const offset = state.depots[i].cards.length * 20;
        // const x = state.depots[i].rect.x + xScale * offset;
        // const y = state.depots[i].rect.y + yScale * offset;
        // Animate from stock if drawn
        // const currentX =
        //   i === KlondikeDepot.Waste &&
        //   state.lastMove?.b === KlondikeDepot.Waste &&
        //   k >= cardValues.length - (state.lastMove?.n ?? 0)
        //     ? state.depots[KlondikeDepot.Stock].rect.x
        //     : x;
        // const currentY =
        //   i === KlondikeDepot.Waste &&
        //   state.lastMove?.b === KlondikeDepot.Waste &&
        //   k >= cardValues.length - (state.lastMove?.n ?? 0)
        //     ? state.depots[KlondikeDepot.Stock].rect.y
        //     : y;
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
};

const score = (state: { depots: Depot[] }) => {
  let result = 0;
  for (let i = KlondikeDepot.Foundation1; i <= KlondikeDepot.Foundation4; i++) {
    result += state.depots[i].cards.length;
  }
  return result;
};

export const Klondike: Game = {
  getAutomaticMoves: () => [],
  initDepots,
  isValidMove,
  isValidStart,
  isRestockValid: () => false,
  isStockEmpty: (state: State) => state.depots[0].cards.length === 0,
  parseMove,
  setState,
  setState2,
  score,
};
