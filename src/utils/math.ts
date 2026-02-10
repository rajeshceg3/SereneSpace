/**
 * Calculates the variance of an array of numbers.
 * @param values The array of numbers.
 * @returns The variance, or 0 if the array is empty or has 1 element.
 */
export const calculateVariance = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return variance;
};

/**
 * Calculates a coherence score (0-100) based on the variance of recent values.
 * Lower variance indicates higher coherence (stability).
 * @param values The array of numbers (e.g., recent stress values).
 * @param sensitivity How sensitive the coherence drop is to variance. Default is 5.
 * @returns A coherence score between 0 and 100.
 */
export const calculateCoherence = (values: number[], sensitivity = 5): number => {
  if (values.length < 2) return 100;
  const variance = calculateVariance(values);
  // Normalize: Variance of 0.2 is chaos (0 coherence), 0 is perfect (100)
  // Formula derived from useAegisData.ts logic
  return Math.max(0, Math.min(100, 100 * (1 - (variance * sensitivity))));
};
