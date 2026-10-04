function lnGamma(value: number): number {
  const coefficients = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (value < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * value)) - lnGamma(1 - value);
  }

  const shifted = value - 1;
  let sum = coefficients[0];
  for (let index = 1; index < coefficients.length; index++) {
    sum += coefficients[index] / (shifted + index);
  }
  const t = shifted + 7 + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(sum);
}

function logFactorial(value: number): number {
  return lnGamma(value + 1);
}

function negativeBinomialPmf(value: number, mean: number, dispersion: number): number {
  if (mean <= 0) return value === 0 ? 1 : 0;
  const probability = dispersion / (dispersion + mean);
  const logCoefficient =
    lnGamma(value + dispersion) - lnGamma(dispersion) - logFactorial(value);
  return Math.exp(
    logCoefficient + dispersion * Math.log(probability) + value * Math.log(1 - probability)
  );
}

function negativeBinomialCdf(value: number, mean: number, dispersion: number): number {
  let cumulative = 0;
  for (let count = 0; count <= Math.floor(value); count++) {
    cumulative += negativeBinomialPmf(count, mean, dispersion);
  }
  return Math.min(cumulative, 1);
}

export interface ThresholdProbability {
  line: number;
  side: 'under' | 'over';
  probability: number;
}

export function estimateNegBinomialDispersion(mean: number, variance: number): number {
  if (variance <= mean) return 1e6;
  return (mean * mean) / (variance - mean);
}

export function generateThresholdProbabilities(
  mean: number,
  dispersion: number,
  lines: number[]
): ThresholdProbability[] {
  return lines.flatMap((line) => {
    const under = negativeBinomialCdf(Math.floor(line), mean, dispersion);
    return [
      { line, side: 'under' as const, probability: under },
      { line, side: 'over' as const, probability: 1 - under },
    ];
  });
}