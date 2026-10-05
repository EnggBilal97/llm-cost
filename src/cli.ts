#!/usr/bin/env node
import { countTokens } from "./tokens.js";
import { estimateCost } from "./cost.js";
import { getPricing, listModels, PRICING } from "./pricing.js";
import { formatCost } from "./format.js";

interface Args {
  model?: string;
  in?: number;
  out?: number;
  cached?: number;
  json: boolean;
  text?: string;
  command: "estimate" | "models" | "help";
}

function parse(argv: string[]): Args {
  const args: Args = { json: false, command: "estimate" };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "models":
      case "list":
        args.command = "models";
        break;
      case "-h":
      case "--help":
        args.command = "help";
        break;
      case "-m":
      case "--model":
        args.model = argv[++i];
        break;
      case "--in":
      case "--input":
        args.in = Number(argv[++i]);
        break;
      case "--out":
      case "--output":
        args.out = Number(argv[++i]);
        break;
      case "--cached":
        args.cached = Number(argv[++i]);
        break;
      case "--json":
        args.json = true;
        break;
      default:
        if (a.startsWith("-")) {
          throw new Error(`Unknown flag: ${a}`);
        }
        positional.push(a);
    }
  }

  if (positional.length) args.text = positional.join(" ");
  return args;
}

const HELP = `llm-cost — count tokens and estimate LLM API costs

Usage:
  llm-cost "your prompt text"        --model gpt-4o
  llm-cost --in 1500 --out 800       --model claude-sonnet-4
  llm-cost "prompt" --out 400        --model gpt-4o-mini
  llm-cost models                    list supported models + prices

Options:
  -m, --model <id>   model id (see "llm-cost models")
      --in <n>       input token count (overrides text)
      --out <n>      output token count
      --cached <n>   cached input token count
      --json         output JSON
  -h, --help         show this help

Notes:
  Token counts from text are estimates. Prices are per 1M tokens.
`;

function printModels(json: boolean): void {
  if (json) {
    process.stdout.write(JSON.stringify(PRICING, null, 2) + "\n");
    return;
  }
  const rows = PRICING.map((p) => ({
    model: p.model,
    provider: p.provider,
    in: `$${p.input}`,
    out: `$${p.output}`,
    cached: p.cachedInput != null ? `$${p.cachedInput}` : "-",
  }));
  const w = {
    model: Math.max(5, ...rows.map((r) => r.model.length)),
    provider: Math.max(8, ...rows.map((r) => r.provider.length)),
  };
  console.log(
    `${"MODEL".padEnd(w.model)}  ${"PROVIDER".padEnd(w.provider)}  ${"IN/1M".padStart(8)}  ${"OUT/1M".padStart(8)}  ${"CACHED".padStart(8)}`,
  );
  for (const r of rows) {
    console.log(
      `${r.model.padEnd(w.model)}  ${r.provider.padEnd(w.provider)}  ${r.in.padStart(8)}  ${r.out.padStart(8)}  ${r.cached.padStart(8)}`,
    );
  }
}

function main(): void {
  let args: Args;
  try {
    args = parse(process.argv.slice(2));
  } catch (err) {
    console.error((err as Error).message);
    process.exit(2);
  }

  if (args.command === "help") {
    process.stdout.write(HELP);
    return;
  }
  if (args.command === "models") {
    printModels(args.json);
    return;
  }

  if (!args.model) {
    console.error('Missing --model. Run "llm-cost --help".');
    process.exit(2);
  }
  if (!getPricing(args.model)) {
    console.error(
      `Unknown model "${args.model}". Run "llm-cost models" to see supported ids.`,
    );
    process.exit(2);
  }

  const inputTokens = args.in ?? (args.text ? countTokens(args.text, args.model) : 0);
  const outputTokens = args.out ?? 0;

  if (!inputTokens && !outputTokens) {
    console.error("Nothing to estimate. Provide text, --in, or --out.");
    process.exit(2);
  }

  const result = estimateCost({
    model: args.model,
    inputTokens,
    outputTokens,
    cachedInputTokens: args.cached,
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  console.log(`Model:   ${result.model} (${result.provider})`);
  console.log(
    `Tokens:  ${result.tokens.input} in` +
      (result.tokens.cachedInput ? ` + ${result.tokens.cachedInput} cached` : "") +
      ` / ${result.tokens.output} out`,
  );
  console.log(`Input:   ${formatCost(result.inputCost)}`);
  if (result.tokens.cachedInput) console.log(`Cached:  ${formatCost(result.cachedInputCost)}`);
  console.log(`Output:  ${formatCost(result.outputCost)}`);
  console.log(`Total:   ${formatCost(result.totalCost)}`);
}

main();
