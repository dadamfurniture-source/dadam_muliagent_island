import { BaseAgent } from "./base-agent";
import { quoteTools } from "../tools/quote-tools";
import { QUOTE_SYSTEM_PROMPT } from "../prompts/quote";

export class QuoteAgent extends BaseAgent {
  constructor() {
    super({
      role: "quote",
      model: "claude-sonnet-4-20250514",
      systemPrompt: QUOTE_SYSTEM_PROMPT,
      tools: quoteTools,
      maxTokens: 2048,
    });
  }
}
