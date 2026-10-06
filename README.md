# llm-cost

Count tokens and estimate **LLM API costs** across OpenAI, Anthropic, Google, and Mistral — from a tiny, **zero-dependency** TypeScript library or the CLI.

Stop guessing what a prompt will cost. Budget before you ship, log spend per request, or compare models in seconds.

```bash
npm install llm-cost
```

```ts
import { estimateCost, countTokens } from "llm-cost";

const cost = estimateCost({
  model: "gpt-4o",
  inputTokens: 1500,
  outputTokens: 800,
});

console.log(cost.totalCost); // 0.011750  (USD)
```

## Why

- **Zero dependencies.** One small package, no native tokenizer to compile, no bloat.
- **Maintained pricing table.** Input, output, and cached-input rates for the models people actually use.
- **TypeScript-first.** Full types, works in Node and edge runtimes.
- **CLI included.** Estimate costs without writing code.

> **On accuracy:** token counts from raw text are *estimates* (a dependency-free
> heuristic, typically within ~10–15% for English and code). When you already
> have exact token counts from an API response, pass them in for exact costs.
> For exact pre-flight counts, use the provider's own tokenizer and feed the
> number to `estimateCost`.

## Library

### `estimateCost(input)`

Estimate cost from known token counts.

```ts
import { estimateCost } from "llm-cost";

const r = estimateCost({
  model: "claude-sonnet-4",
  inputTokens: 50_000,
  outputTokens: 2_000,
  cachedInputTokens: 40_000, // billed at the cached rate, subtracted from input
});

r.totalCost;        // total USD
r.inputCost;        // uncached input cost
r.cachedInputCost;  // cached input cost
r.outputCost;       // output cost
r.tokens;           // { input, cachedInput, output } actually billed
```

### `countTokens(text, model?)`

Approximate the token count of a string. The optional `model` nudges the ratio
to the right tokenizer family.

```ts
import { countTokens } from "llm-cost";

countTokens("The quick brown fox.", "gpt-4o"); // ~6
```

### `estimateCostFromText(input)`

Convenience: estimate tokens from raw text, then cost.

```ts
import { estimateCostFromText } from "llm-cost";

estimateCostFromText({
  model: "gpt-4o-mini",
  input: "Summarize this article in three bullets.",
  output: "- point one\n- point two\n- point three",
}).totalCost;
```

### `getPricing(model)` / `listModels()` / `PRICING`

```ts
import { getPricing, listModels, PRICING } from "llm-cost";

getPricing("claude-3-5-sonnet"); // resolves aliases → claude-sonnet-4 pricing
listModels();                    // ["gpt-4o", "gpt-4o-mini", ...]
PRICING;                         // the full table
```

### `formatCost(usd)`

Format a USD amount the way the CLI does — 6 decimals for sub-cent costs, 4
otherwise. Handy for logs and dashboards.

```ts
import { formatCost } from "llm-cost";

formatCost(0.001542); // "$0.001542"
formatCost(12.5);     // "$12.5000"
formatCost(0);        // "$0.00"
```

## CLI

```bash
# Estimate from text (input tokens are estimated) plus an output budget
llm-cost "Summarize this document in three bullets." --model gpt-4o --out 150

# Estimate from exact token counts, with prompt caching
llm-cost --in 50000 --out 2000 --cached 40000 --model claude-sonnet-4

# List supported models and their prices
llm-cost models

# JSON output for scripting
llm-cost --in 1000 --out 500 --model gpt-4o-mini --json
```

```
Model:   gpt-4o (openai)
Tokens:  17 in / 150 out
Input:   $0.000043
Output:  $0.001500
Total:   $0.001542
```

Run it without installing:

```bash
npx llm-cost "hello world" --model gpt-4o-mini --out 50
```

## Supported models

OpenAI (`gpt-4o`, `gpt-4o-mini`, `o1`, `o1-mini`, `o3-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`),
Anthropic (`claude-opus-4`, `claude-sonnet-4`, `claude-haiku-3.5`, `claude-haiku-3`),
Google (`gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`),
Mistral (`mistral-large`, `mistral-small`).

Common aliases (e.g. `claude-3-5-sonnet`, `mistral-large-latest`) resolve automatically.
Run `llm-cost models` for the live list with prices.

## Pricing policy

All prices are USD per 1M tokens and live in [`src/pricing.ts`](src/pricing.ts),
**last verified 2026-10-06**. Providers change prices often — if something looks
stale, [open an issue or PR](https://github.com/EnggBilal97/llm-cost/issues).
Always confirm against the provider's official pricing page for billing-critical use.

## License

MIT © [Muhammad Bilal](https://github.com/EnggBilal97)

