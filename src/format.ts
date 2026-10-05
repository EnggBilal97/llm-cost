/**
 * Format a USD cost as a human-readable string.
 *
 * Tiny costs (< $0.01) keep 6 decimals so sub-cent amounts stay legible;
 * larger costs round to 4. Negative inputs are clamped to zero.
 */
export function formatCost(usd: number): string {
  const n = usd > 0 ? usd : 0;
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(4)}`;
}
