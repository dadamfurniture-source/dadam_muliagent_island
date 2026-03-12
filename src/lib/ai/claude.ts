import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export { anthropic };

export async function chatWithClaude(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  options?: { maxTokens?: number; model?: string },
) {
  const response = await anthropic.messages.create({
    model: options?.model ?? "claude-sonnet-4-20250514",
    max_tokens: options?.maxTokens ?? 2048,
    system: systemPrompt,
    messages,
  });

  return response;
}

export async function streamClaude(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  options?: { maxTokens?: number; model?: string },
) {
  const stream = anthropic.messages.stream({
    model: options?.model ?? "claude-sonnet-4-20250514",
    max_tokens: options?.maxTokens ?? 2048,
    system: systemPrompt,
    messages,
  });

  return stream;
}
