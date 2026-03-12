import { BaseAgent } from "@/lib/ai/agents/base-agent";
import { consultationTools } from "@/lib/ai/tools/consultation-tools";
import { CONSULTATION_SYSTEM_PROMPT } from "@/lib/ai/prompts/chat";

export class ConsultationAgent extends BaseAgent {
  constructor() {
    super({
      role: "consultation",
      model: "claude-sonnet-4-20250514",
      systemPrompt: CONSULTATION_SYSTEM_PROMPT,
      tools: consultationTools,
      maxTokens: 2048,
    });
  }
}
