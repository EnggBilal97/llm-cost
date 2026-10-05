import { getPricing, type ModelPricing } from "./pricing.js";

/**
 * Approximate token count for a string.
 *
 * This is a dependency-free *estimate*, not an exact BPE tokenization. It blends
 * a character-based and a word-based estimate, which tracks real tokenizers to
 * within roughly 10–15% for typical English prose and code. For exact counts,
 * use the provider's own tokenizer (tiktoken, @anthropic-ai/tokenizer, etc.).
 *
 * The `model` (or tokenizer family) only nudges the ratio slightly — newer
 * tokenizers (o200k) pack marginally more characters per token than older ones.
 */
export function countTokens(text: string, model?: string): number {
  if (!text) return 0;

  const pricing = model ? getPricing(model) : undefined;
  const ratio = charsPerToken(pricing);

  const charEstimate = text.length / ratio;

  // Word-ish estimate: whitespace runs + punctuation tend to break tokens.
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const punctuation = (text.match(/[.,!?;:"'()\[\]{}<>/\\|@#$%^&*=+~`-]/g) ?? []).length;
  const wordEstimate = words * 1.3 + punctuation * 0.5;

  // Average the two estimates; they fail in opposite directions.
  const estimate = (charEstimate + wordEstimate) / 2;

  return Math.max(1, Math.round(estimate));
}

function charsPerToken(pricing?: ModelPricing): number {
  switch (pricing?.tokenizer) {
    case "o200k":
      return 4.1;
    case "cl100k":
      return 4.0;
    case "claude":
      return 3.6;
    case "gemini":
      return 4.0;
    case "mistral":
      return 3.8;
    default:
      return 4.0;
  }
}
