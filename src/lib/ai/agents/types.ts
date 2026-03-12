import type Anthropic from "@anthropic-ai/sdk";

// ============================================
// 에이전트 시스템 타입 정의
// ============================================

export type AgentRole =
  | "orchestrator"
  | "consultation"
  | "image"
  | "quote"
  | "drawing"
  | "schedule";

export const AGENT_ROLE_LABELS: Record<AgentRole, string> = {
  orchestrator: "총괄 에이전트",
  consultation: "상담 에이전트",
  image: "이미지 에이전트",
  quote: "견적 에이전트",
  drawing: "도면 에이전트",
  schedule: "일정 에이전트",
};

export interface AgentTool {
  name: string;
  description: string;
  input_schema: Anthropic.Tool["input_schema"];
  execute: (input: Record<string, unknown>) => Promise<string>;
}

export interface AgentConfig {
  role: AgentRole;
  model: string;
  systemPrompt: string;
  tools: AgentTool[];
  maxTokens?: number;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentRole?: AgentRole;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AgentContext {
  userId: string;
  projectId?: string;
  conversationHistory: AgentMessage[];
  sessionData: Record<string, unknown>;
}

export interface AgentResponse {
  message: string;
  agentRole: AgentRole;
  toolResults?: Array<{
    tool: string;
    result: unknown;
  }>;
  handoff?: AgentRole;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestratorDecision {
  targetAgent: AgentRole;
  reason: string;
  modifiedPrompt?: string;
}
