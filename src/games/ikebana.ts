import { Card, Suit } from "../cards";
import { Game, State } from "../game";
import { CardSprite, Depot, Rect } from "../layout";

export enum IkebanaDepot {
  Tableau1,
  Tableau2,
  Tableau3,
  Tableau4,
  Tableau5,
  Tableau6,
  Tableau7,
  Tableau8,
}

const initDepots = (
  state: { depots: Depot[] },
  left: number,
  top: number,
  cardWidth: number,
  cardHeight: number,
) => {
  state.depots = [];

  // Tableau
  for (let i = 0; i < 8; i++) {
    state.depots.push({
      id: state.depots.length,
      rect: Rect.from(left + 70 * i, top, cardWidth, cardHeight),
      type: "column",
      cards: [],
      visible: true,
    });
  }
};

const isValidStart = (state: { depots: Depot[] }, a: number, n: number) => {
  if (n === 0) return false;

  const cards = state.depots[a].cards.slice(state.depots[a].cards.length - n);
  console.log(cards);

  if (n > 1 && !isDescending(cards)) {
    return false;
  }

  return true;
};

const isDescending = (cards: CardSprite[]) => {
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].card.suit !== cards[i - 1].card.suit - 1) return false;
  }

  return true;
};

// 1  pine          bright, ribbon, 2 chaff
// 2  plum          animal, ribbon, 2 chaff
// 3  cherry        bright, ribbon, 2 chaff
// 4  wisteria      animal, ribbon, 2 chaff
// 5  water iris    animal, ribbon, 2 chaff
// 6  peony         animal, ribbon, 2 chaff
// 7  bush clover   animal, ribbon, 2 chaff
// 8  susuki grass  bright, animal, 2 chaff
// 9  chrysanthemum animal, ribbon, 2 chaff
// 10 maple         animal, ribbon, 2 chaff
// 11 willow        bright, animal, ribbon, chaff
// 12 paulownia     bright, 3 chaff

// 36 unique cards
// 48 * 47 * (46 * 45 / 2) *
// 44 * 43 * (42 * 41 / 2) *
// 40 * 39 * (38 * 37 / 2) *
// 36 * 35 * (34 * 33 / 2) *
// 32 * 31 * (30 * 29 / 2) *
// 28 * 27 * (26 * 25 / 2) *
// 24 * 23 * (22 * 21 / 2) *
// 20 * 19 * (18 * 17 / 2) *
// 16 * 15 * (14 * 13 / 2) *
// 12 * 11 * (10 *  9 / 2) *
// 8 * 7 * 6 * 5
// 4 * 1
//

// 48 * 47 * (46 * 45 / 2) *
// 44 * 43 * (42 * 41 / 2) *
// 40 * 39 * (38 * 37 / 2) *
// 36 * 35 * (34 * 33 / 2) *
// 32 * 31 * (30 * 29 / 2) *
// 28 * 27 * (26 * 25 / 2) *
// 24 * 23 * (22 * 21 / 2) *
// 20 * 19 * (18 * 17 / 2) *
// 16 * 15 * (14 * 13 / 2) *
// 2 * 11 * (10 *  9 / 2) *
// 1 * 1 * 1 * 1
// 1 * 1
//

// 12: 0-11

//

// 48c4 * 12
// 44c4 * 12
// 40c4 * 12
// 36c4 * 12
// 32c4 * 12
// 28c4 * 12
// 24c4 * 12
// 20c4 * 12
// 16c4 * 12
// 12c4 * 12
//  8c4 * 24
//  4c4 *  4

// 8! = 8c4 * 12 * 12 * 4

// 48c4 * 12
// 44c4 * 12
// 40c4 * 12
// 36c4 * 12
// 32c4 * 12
// 28c4 * 12
// 24c4 * 12
// 20c4 * 12
// 16c4 *  1 [] [?, ?, ?, ?]
// 12c4 *  1 [] [?, ?, ?, ?]
//    1 * 24 [?, ?, ?, ?] []
//    1 *  1 [0, 0, 0, 0] [?, ?, ?, ?]

// permutation of 11s
// combination of 10s
// combination of  9s

// When there are 32 spots left, there could be spots open in 6-8 columns.
// This selects column 1.
// When there are 28 spots left, there could be spots open in 5-8 columns.
// This selects column 2.

// 4 * 27 *
// 32 spots for a card
//

// set the suits for the 2s based on the order of the 7-columns
// 4! ways to set the columns, 4! ways to set the twos

// 48c1 * 47c1 * 46c2
// 44c1 * 43c1 * 42c2

// 100000000

// unique shuffles: 48! / 3! / 2^10
// unique games:    48! / 3! / 2^10 / 8!

// 32 spots left.... why are there only 4 effectively? first quarter, second quarter, ...

// fn is_descending(cards: &[Card]) -> bool {
//     if cards.len() <= 1 {
//         return true;
//     }

//     for i in 1..cards.len() {
//         if rank(cards[i]) != rank(cards[i - 1]) - 1 {
//             return false;
//         }
//     }

//     true
// }

const isValidMove = (
  state: { depots: Depot[]; hand: CardSprite[] },
  a: number,
  b: number,
  n: number,
) => {
  if (n === 0) return false;
  if (a === b) return false;

  if (b < IkebanaDepot.Tableau1 || b > IkebanaDepot.Tableau8) return false;

  const depotB = state.depots[b];

  const cards = state.hand;
  const firstCard = cards[0].card;
  const topDepotCard =
    depotB.cards.length === 0
      ? undefined
      : depotB.cards[depotB.cards.length - 1].card;

  if (n > 1 && !isDescending(cards)) {
    return false;
  }

  if (!topDepotCard) return firstCard.suit === 11; // Only 12s can go in empty columns

  const isValidSuit = firstCard.suit === topDepotCard.suit - 1;
  const isValidRank =
    firstCard.rank !== 0 && firstCard.rank === topDepotCard.rank;
  console.log(firstCard, topDepotCard);

  return isValidRank || isValidSuit;
};

const parseMove = (
  _state: { depots: Depot[] },
  a: number,
  b: number,
  n: number,
) => [true, a, b, n] as const;

const setState = (
  state: {
    cards: CardSprite[];
    depots: Depot[];
    lastMove?: { a: number; b: number; n: number };
    moves: { a: number; b: number; n: number }[];
  },
  data: string[],
) => {
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
      const suit = Math.floor(cardValue / 4);
      const rank = Math.floor(cardValue % 4);
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

  console.log(
    "cards",
    state.cards.map(({ card }) => card),
  );
};

const left = 15;
const cardWidth = 59;
const marginX = 11;

const score = (state: { depots: Depot[] }) => {
  let score = 0;

  state.depots.forEach((depot) => {
    if (
      depot.cards.length > 0 &&
      depot.cards[depot.cards.length - 1].card.suit === 0
    ) {
      score += 1;
      for (let i = depot.cards.length - 2; i >= 0; i--) {
        if (depot.cards[i].card.suit === depot.cards[i + 1].card.suit + 1)
          score += 1;
      }
    }
  });

  return score;
};

export const Ikebana: Game = {
  foundations: () => [],
  getAutomaticMoves: () => [],
  initDepots,
  isValidMove,
  isValidStart,
  isRestockValid: () => false,
  isStockEmpty: (_state: State) => true,
  isWin: (state: State) => score(state) === 48,
  layoutWidth: () => (cardWidth + marginX) * 8 - marginX + 2 * left,
  layoutHeight: () => 435 + 100,
  parseMove,
  setState,
  score,
};
