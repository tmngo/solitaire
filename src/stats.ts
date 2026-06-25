const kalmanEstimates = (
  outcomes: boolean[],
  processVar = 0.03,
  x0 = 0,
  v0 = 4,
) => {
  let x = x0; // mean
  let v = v0; // variance

  let means = [];
  let variances = [];

  for (let i = 0; i < outcomes.length; i++) {
    let result = kalmanEstimate(outcomes[i], x, v, processVar);

    means.push(result[0]);
    variances.push(result[1]);

    x = result[0];
    v = result[1];
  }

  return [means, variances] as const;
};

export const kalmanEstimate = (
  outcome: boolean,
  x0: number,
  v0: number,
  processVar = 0.03,
) => {
  const y = outcome ? 1 : 0;
  let xPred = x0;
  let vPred = v0 + processVar;

  const pPred = sigmoid(xPred);
  const h = pPred * (1 - pPred);
  const r = pPred * (1 - pPred);

  const innovation = y - pPred;
  const s = h * h * vPred + r;
  const k = (vPred * h) / s;

  const x = xPred + k * innovation;
  const v = (1 - k * h) * vPred;

  return [x, v] as const;
};

export const kalmanWinrate = (mean: number, variance: number) => {
  const prob = sigmoid(mean);
  const stdev = Math.sqrt(variance);
  const lo = sigmoid(mean - 1.96 * stdev); // 95% confidence interval
  const hi = sigmoid(mean + 1.96 * stdev);
  return { prob, lo, hi };
};

const sigmoid = (x: number) => 1.0 / (1.0 + Math.exp(-x));

const logit = (p: number) => Math.log(p / (1 - p));
