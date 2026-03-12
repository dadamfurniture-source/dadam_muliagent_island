import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentConfig,
  AgentContext,
  AgentResponse,
} from "@/lib/ai/agents/types";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export class BaseAgent {
  protected config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async run(
    userMessage: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    const messages = this.buildMessages(userMessage, context);
    const tools = this.buildTools();

    const response = await anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens ?? 2048,
      system: this.config.systemPrompt,
      tools: tools.length > 0 ? tools : undefined,
      messages,
    });

    return this.processResponse(response, messages);
  }

  private buildMessages(
    userMessage: string,
    context: AgentContext,
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = [];

    // 최근 대화 이력 포함 (최대 20개)
    const recentHistory = context.conversationHistory.slice(-20);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // 현재 메시지
    if (userMessage) {
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    return messages;
  }

  private buildTools(): Anthropic.Tool[] {
    return this.config.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    }));
  }

  private async processResponse(
    response: Anthropic.Message,
    originalMessages: Anthropic.MessageParam[],
  ): Promise<AgentResponse> {
    const toolResults: Array<{ tool: string; result: unknown }> = [];
    let finalText = "";

    for (const block of response.content) {
      if (block.type === "text") {
        finalText += block.text;
      }
    }

    // tool_use가 있는 경우 도구 실행
    const toolUseBlocks = response.content.filter(
      (b) => b.type === "tool_use",
    );

    if (toolUseBlocks.length > 0) {
      const toolResultContents: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        if (block.type !== "tool_use") continue;

        const tool = this.config.tools.find((t) => t.name === block.name);
        if (!tool) {
          toolResultContents.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: `Tool "${block.name}" not found`,
            is_error: true,
          });
          continue;
        }

        try {
          const result = await tool.execute(
            block.input as Record<string, unknown>,
          );
          toolResults.push({ tool: block.name, result });
          toolResultContents.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          toolResultContents.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: errorMsg,
            is_error: true,
          });
        }
      }

      // 도구 실행 후 후속 응답: 원본 대화 + 어시스턴트 응답 + 도구 결과
      const followUp = await anthropic.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens ?? 2048,
        system: this.config.systemPrompt,
        messages: [
          ...originalMessages,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResultContents },
        ],
      });

      // 후속 응답으로 최종 텍스트 교체
      finalText = "";
      for (const block of followUp.content) {
        if (block.type === "text") {
          finalText += block.text;
        }
      }
    }

    return {
      message: finalText,
      agentRole: this.config.role,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
    };
  }
}
