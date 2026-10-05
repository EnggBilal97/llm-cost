/**
 * Model pricing table.
 *
 * All prices are in USD per 1,000,000 tokens.
 * `cachedInput` is the price for cached/prompt-cached input tokens where the
 * provider offers it; `undefined` means the provider has no separate cached rate.
 *
 * Prices last verified: 2026-10-06. Providers change pricing often — open a PR
 * if something here is stale. See README for the verification policy.
 */

export type Provider = "openai" | "anthropic" | "google" | "mistral";

export interface ModelPricing {
  /** Canonical model id. */
  model: string;
  provider: Provider;
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M output tokens. */
  output: number;
  /** USD per 1M cached input tokens, if the provider offers prompt caching. */
  cachedInput?: number;
  /** Tokenizer family, used to pick a token-estimation ratio. */
  tokenizer: "o200k" | "cl100k" | "claude" | "gemini" | "mistral";
  /** Alternative ids that map to this model. */
  aliases?: string[];
}

export const PRICING: ModelPricing[] = [
  // ---- OpenAI ----
  { model: "gpt-4o", provider: "openai", input: 2.5, output: 10, cachedInput: 1.25, tokenizer: "o200k", aliases: ["gpt-4o-2024-08-06"] },
  { model: "gpt-4o-mini", provider: "openai", input: 0.15, output: 0.6, cachedInput: 0.075, tokenizer: "o200k" },
  { model: "o1", provider: "openai", input: 15, output: 60, cachedInput: 7.5, tokenizer: "o200k" },
  { model: "o1-mini", provider: "openai", input: 1.1, output: 4.4, cachedInput: 0.55, tokenizer: "o200k" },
  { model: "o3-mini", provider: "openai", input: 1.1, output: 4.4, cachedInput: 0.55, tokenizer: "o200k" },
  { model: "gpt-4-turbo", provider: "openai", input: 10, output: 30, tokenizer: "cl100k" },
  { model: "gpt-3.5-turbo", provider: "openai", input: 0.5, output: 1.5, tokenizer: "cl100k" },

  // ---- Anthropic ----
  { model: "claude-opus-4", provider: "anthropic", input: 15, output: 75, cachedInput: 1.5, tokenizer: "claude", aliases: ["claude-3-opus"] },
  { model: "claude-sonnet-4", provider: "anthropic", input: 3, output: 15, cachedInput: 0.3, tokenizer: "claude", aliases: ["claude-3-5-sonnet", "claude-3-sonnet"] },
  { model: "claude-haiku-3.5", provider: "anthropic", input: 0.8, output: 4, cachedInput: 0.08, tokenizer: "claude", aliases: ["claude-3-5-haiku"] },
  { model: "claude-haiku-3", provider: "anthropic", input: 0.25, output: 1.25, cachedInput: 0.03, tokenizer: "claude" },

  // ---- Google ----
  { model: "gemini-2.0-flash", provider: "google", input: 0.1, output: 0.4, tokenizer: "gemini" },
  { model: "gemini-1.5-pro", provider: "google", input: 1.25, output: 5, cachedInput: 0.3125, tokenizer: "gemini" },
  { model: "gemini-1.5-flash", provider: "google", input: 0.075, output: 0.3, cachedInput: 0.01875, tokenizer: "gemini" },

  // ---- Mistral ----
  { model: "mistral-large", provider: "mistral", input: 2, output: 6, tokenizer: "mistral", aliases: ["mistral-large-latest"] },
  { model: "mistral-small", provider: "mistral", input: 0.2, output: 0.6, tokenizer: "mistral", aliases: ["mistral-small-latest"] },
];

const INDEX: Map<string, ModelPricing> = (() => {
  const map = new Map<string, ModelPricing>();
  for (const entry of PRICING) {
    map.set(entry.model.toLowerCase(), entry);
    for (const alias of entry.aliases ?? []) {
      map.set(alias.toLowerCase(), entry);
    }
  }
  return map;
})();

/** Look up pricing by model id or alias. Returns `undefined` if unknown. */
export function getPricing(model: string): ModelPricing | undefined {
  return INDEX.get(model.trim().toLowerCase());
}

/** List every known canonical model id. */
export function listModels(): string[] {
  return PRICING.map((p) => p.model);
}
