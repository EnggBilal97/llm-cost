import { getPricing } from "./pricing.js";
import { countTokens } from "./tokens.js";

export interface CostInput {
  model: string;
  /** Number of input/prompt tokens. */
  inputTokens?: number;
  /** Number of output/completion tokens. */
  outputTokens?: number;
  /**
   * Number of input tokens served from cache. Billed at the model's cached rate
   * when available, and subtracted from `inputTokens`. Must be <= inputTokens.
   */
  cachedInputTokens?: number;
}

export interface CostBreakdown {
  model: string;
  provider: string;
  inputCost: number;
  cachedInputCost: number;
  outputCost: number;
  /** Total cost in USD. */
  totalCost: number;
  currency: "USD";
  tokens: {
    input: number;
    cachedInput: number;
    output: number;
  };
}

/** Round to 6 decimal places to avoid floating-point noise in tiny costs. */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * Estimate the cost of a request from known token counts.
 * Throws if the model is unknown — catch it or check `getPricing` first.
 */
export function estimateCost(input: CostInput): CostBreakdown {
  const pricing = getPricing(input.model);
  if (!pricing) {
    throw new Error(
      `Unknown model "${input.model}". Use listModels() to see supported ids.`,
    );
  }

  const totalInput = Math.max(0, input.inputTokens ?? 0);
  const output = Math.max(0, input.outputTokens ?? 0);
  let cached = Math.max(0, input.cachedInputTokens ?? 0);
  if (cached > totalInput) cached = totalInput;

  const uncachedInput = totalInput - cached;
  const cachedRate = pricing.cachedInput ?? pricing.input;

  const inputCost = (uncachedInput / 1_000_000) * pricing.input;
  const cachedInputCost = (cached / 1_000_000) * cachedRate;
  const outputCost = (output / 1_000_000) * pricing.output;

  return {
    model: pricing.model,
    provider: pricing.provider,
    inputCost: round(inputCost),
    cachedInputCost: round(cachedInputCost),
    outputCost: round(outputCost),
    totalCost: round(inputCost + cachedInputCost + outputCost),
    currency: "USD",
    tokens: { input: uncachedInput, cachedInput: cached, output },
  };
}

export interface TextCostInput {
  model: string;
  /** Prompt text — tokens are estimated with countTokens(). */
  input?: string;
  /** Completion text — tokens are estimated with countTokens(). */
  output?: string;
}

/**
 * Convenience wrapper: estimate tokens from raw text, then estimate cost.
 * Token counts are approximate (see countTokens).
 */
export function estimateCostFromText(input: TextCostInput): CostBreakdown {
  return estimateCost({
    model: input.model,
    inputTokens: input.input ? countTokens(input.input, input.model) : 0,
    outputTokens: input.output ? countTokens(input.output, input.model) : 0,
  });
}
