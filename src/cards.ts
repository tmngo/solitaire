export enum Suit {
  Clubs,
  Diamonds,
  Hearts,
  Spades,
  Unknown,
}

export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export class BitString {
  bytes: Uint8Array;
  length: number;

  constructor(length: number = 8, set: number[] = []) {
    this.bytes = new Uint8Array(Math.ceil(length / 8));
    this.length = length;
    set.forEach((i) => {
      this.set(i, true);
    });
  }

  get = (position: number) => {
    const { byte, bit } = this.indices(position);
    return this.bytes[byte] & bit;
  };

  set = (position: number, on: boolean) => {
    const { byte, bit } = this.indices(position);
    if (on) {
      this.bytes[byte] |= bit;
    } else {
      this.bytes[byte] &= 0xff ^ bit;
    }
  };

  indices = (position: number) => {
    if (position >= this.length) {
      throw new Error(
        `Position ${position} is out of range 0-${this.length - 1}.`
      );
    }
    const byte = Math.floor(position / 8);
    const bit = 1 << position % 8;
    return { byte, bit };
  };

  digits = (separator: string = "_") => {
    let result = Array<string>(this.bytes.length);
    for (let i = 0; i < this.bytes.length; i++) {
      // console.log(this.bytes[i], this.bytes[i].toString(2).padStart(8, "0"));
      result[this.bytes.length - i - 1] = this.bytes[i]
        .toString(2)
        .padStart(8, "0");
    }
    return result.join(separator);
  };

  value = () => {
    let sum = 0;
    let exponent = 0;
    for (let i = 0; i < this.bytes.length; i++) {
      sum += this.bytes[i] << exponent;
      exponent += 8;
    }
    return sum;
  };

  randomize = () => {
    let remainingBits = this.length % 8;
    let n = this.bytes.length;
    if (remainingBits > 0) {
      n--;
      this.bytes[n - 1] = Math.floor(Math.random() * (1 << remainingBits));
    }
    for (let i = 0; i < n; i++) {
      this.bytes[i] = Math.floor(Math.random() * 256);
    }
  };
}

export interface Card {
  suit: Suit;
  rank: Rank;
}

const from = (suit: Suit, rank: Rank): Card => ({ suit, rank });

const isRank = (r: number): r is Rank => r >= 0 && r < 13;

const compareCards = (a: Card, b: Card) => {
  if (a.suit === b.suit) return a.rank - b.rank;
  return a.suit - b.suit;
};

export const Card = {
  compareCards,
  from,
  isRank,
};

// permutations = Array<Array<number>>

/*
int n = 5;
int number = 37;

int[] sequence = new int[n - 1];
int base = 2;

for (int k = 0; k < sequence.Length; k++)
{
    sequence[k] = number % base;
    number = number / base;

    base++; // b[k+1] = b[k] + 1
}
*/

export const decodePermutation = (a: BitString) => {
  const sequence = Array<number>(52);
  let number = a;
  let base = 2;
  for (let k = sequence.length - 2; k >= 0; k--) {
    sequence[k] = remainder(number, base);
    number = quotient(number, base);
    base++;
  }
  sequence[sequence.length - 1] = 0;
  return sequence;
};

export const permutationCards = (sequence: number[]) => {
  let n = sequence.length;
  let cards = Array<Card>(n);
  let set = Array<boolean>(n);
  for (let i = 0; i < n; i++) {
    let s = sequence[i];
    let remainingPosition = 0;
    let index = 0;

    for (index = 0; index < n; index++) {
      if (!set[index]) {
        if (remainingPosition === s) break;
        remainingPosition++;
      }
    }
    cards[index] = {
      suit: Math.floor(i / 13) as Suit,
      rank: (i % 13) as Rank,
    };
    set[index] = true;
  }
  return cards;
};

// a % n
export const remainder = (a: BitString, n: number) => {
  let sum = 0;
  let exponent = 0;
  for (let i = 0; i < a.bytes.length; i++) {
    let c = mod_exponent_scaled(a.bytes[i], 2, exponent, n);
    // console.log(a.bytes[i], exponent, c);
    sum += c;
    exponent += 8;
  }
  return sum % n;
};

// ab^e % n = [(a % n) (b^e % n)] % n
export const mod_exponent_scaled = (
  a: number,
  b: number,
  e: number,
  n: number
) => {
  const r1 = a % n;
  const r2 = mod_exponent(b, e, n);
  return (r1 * r2) % n;
};

// ab % n = [(a % n) (b % n)] % n
export const mod_exponent = (b: number, e: number, n: number) => {
  if (b === 0 || n === 1) return 0;
  let c = 1;
  for (let e1 = 0; e1 < e; e1++) {
    c = (b * c) % n;
  }
  return c;
};

// 171, 170, 85, 1

export const quotient = (a: BitString, v: number) => {
  const b = 256;
  const N = 1;
  const M = a.bytes.length - N;
  let u = new Uint8Array(M + N + 1);
  // console.log(a.bytes);
  for (let i = 0; i < M + N; i++) {
    u[i] = a.bytes[i];
  }
  // v = v;
  let quotient = new Uint8Array(M + N);
  let r = 0;
  for (let j = M; j >= 0; j--) {
    // Compute quotient digit
    let numerator = u[j + 1] * b + u[j];
    // console.log("numerator", u[j + 1], u[j]);

    let qhat = Math.floor(numerator / v); // first two digits of numerator, first digit of denominator
    // console.log("numerator", numerator);
    // console.log("qhat", qhat);
    r = numerator % v;
    // console.log({ numerator, v, qhat, r });
    do {
      if (qhat >= b) {
        qhat -= 1;
        r += v;
      } else {
        break;
      }
    } while (r < b);

    // Multiply and subtract
    let product = qhat * v;
    u[j] -= product & 0xffffffff;
    // console.log({ j, numerator, qhat, r, product, remu: u[j] });
    // let k = (product >> 32) - (u[j] >> 32);
    // u[j + 1] -= k;

    // Test remainder
    quotient[j] = qhat;
    if (u[j + 1] < 0) {
      quotient[j] -= 1;
      u[j] += v;
      // let k = u[j] >> 32;
      // u[j + 1] += k;
    }
  }
  let q = new BitString(a.length);
  q.bytes = quotient;
  // console.assert(a.length === quotient.length);
  // console.log({ numerator: a.bytes, quotient });
  return q;
};

export const testBitStrings = () => {
  console.log("Running tests...");

  let indices = [0, 1, 3, 16, 29];
  let a = new BitString(32, indices);
  let b = 0;
  indices.forEach((i) => {
    b |= 1 << i;
  });

  let v = a.value();
  let expected = b;
  console.assert(v === expected, "a.value() != b");

  testQuotient(a, b, 142);
  testQuotient(a, b, 2);
  testQuotient(a, b, 1);
  testRemainder(a, b, 16);
  testRemainder(a, b, 313);

  console.log("Tests passed!");
};

const testQuotient = (a: BitString, b: number, c: number) => {
  let result = quotient(a, c).value();
  let expected = Math.floor(b / c);
  console.assert(
    result === expected,
    `Expected ${b} / ${c} to be %i, got %i`,
    expected,
    result
  );
};

const testRemainder = (a: BitString, b: number, c: number) => {
  let result = remainder(a, c);
  let expected = b % c;
  console.assert(
    result === expected,
    `Expected ${b} % ${c} to be %i, got %i`,
    expected,
    result
  );
};
