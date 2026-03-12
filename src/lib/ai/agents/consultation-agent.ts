import { BaseAgent } from "./base-agent";
import { consultationTools } from "../tools/consultation-tools";
import { CONSULTATION_SYSTEM_PROMPT } from "../prompts/chat";

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
