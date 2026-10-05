import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countTokens,
  estimateCost,
  estimateCostFromText,
  formatCost,
  getPricing,
  listModels,
} from "../dist/index.js";

test("countTokens returns 0 for empty string", () => {
  assert.equal(countTokens(""), 0);
});

test("countTokens scales roughly with length", () => {
  const short = countTokens("hello world", "gpt-4o");
  const long = countTokens("hello world ".repeat(100), "gpt-4o");
  assert.ok(long > short);
  assert.ok(short >= 1);
});

test("getPricing resolves canonical ids and aliases", () => {
  assert.equal(getPricing("gpt-4o")?.provider, "openai");
  assert.equal(getPricing("claude-3-5-sonnet")?.model, "claude-sonnet-4");
  assert.equal(getPricing("GPT-4O")?.provider, "openai");
  assert.equal(getPricing("nope"), undefined);
});

test("listModels returns a non-empty list", () => {
  assert.ok(listModels().length > 5);
});

test("estimateCost computes input + output cost", () => {
  // gpt-4o: $2.50/1M in, $10/1M out
  const r = estimateCost({ model: "gpt-4o", inputTokens: 1_000_000, outputTokens: 1_000_000 });
  assert.equal(r.inputCost, 2.5);
  assert.equal(r.outputCost, 10);
  assert.equal(r.totalCost, 12.5);
});

test("estimateCost applies cached rate and subtracts from input", () => {
  // gpt-4o: cached $1.25/1M
  const r = estimateCost({
    model: "gpt-4o",
    inputTokens: 1_000_000,
    cachedInputTokens: 1_000_000,
  });
  assert.equal(r.inputCost, 0);
  assert.equal(r.cachedInputCost, 1.25);
  assert.equal(r.tokens.cachedInput, 1_000_000);
});

test("estimateCost caps cached tokens at input tokens", () => {
  const r = estimateCost({ model: "gpt-4o", inputTokens: 100, cachedInputTokens: 500 });
  assert.equal(r.tokens.cachedInput, 100);
  assert.equal(r.tokens.input, 0);
});

test("estimateCost throws on unknown model", () => {
  assert.throws(() => estimateCost({ model: "ghost-model", inputTokens: 10 }));
});

test("formatCost renders zero, sub-cent, and larger amounts", () => {
  assert.equal(formatCost(0), "$0.00");
  assert.equal(formatCost(-5), "$0.00");
  assert.equal(formatCost(0.001542), "$0.001542");
  assert.equal(formatCost(12.5), "$12.5000");
});

test("estimateCostFromText estimates tokens then cost", () => {
  const r = estimateCostFromText({
    model: "gpt-4o-mini",
    input: "Summarize the following article in three bullet points.",
    output: "Done.",
  });
  assert.ok(r.totalCost >= 0);
  assert.ok(r.tokens.input > 0);
  assert.equal(r.model, "gpt-4o-mini");
});
