import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentContext,
  AgentResponse,
  AgentRole,
  OrchestratorDecision,
} from "@/lib/ai/agents/types";
import { ConsultationAgent } from "@/lib/ai/agents/consultation-agent";
import { ImageAgent } from "@/lib/ai/agents/image-agent";
import { QuoteAgent } from "@/lib/ai/agents/quote-agent";
import { ScheduleAgent } from "@/lib/ai/agents/schedule-agent";
import { BaseAgent } from "@/lib/ai/agents/base-agent";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const VALID_AGENTS: AgentRole[] = ["consultation", "image", "quote", "schedule"];

const ORCHESTRATOR_SYSTEM_PROMPT = `당신은 주문제작 가구 AI 플랫폼의 오케스트레이터입니다.
사용자의 메시지를 분석하여 가장 적합한 전문 에이전트에게 작업을 위임합니다.

사용 가능한 에이전트:
1. consultation - 상담 에이전트: 가구 상담, 요구사항 파악, 가구/스타일/자재 추천
2. image - 이미지 에이전트: 현장사진에 가구 합성, AI 이미지 생성
3. quote - 견적 에이전트: 견적 산출, 가격 문의, 비용 관련
4. schedule - 일정 에이전트: 실측/설치/A/S 일정 예약, 워크플로우 관리

판단 기준:
- 가구에 대한 일반적인 질문, 스타일/자재 추천, 첫 상담 → consultation
- 사진 업로드, 이미지 생성/수정 요청, 가구 시각화 → image
- 가격, 비용, 견적, 예산 관련 → quote
- 일정, 예약, 방문, 워크플로우 상태 변경 → schedule
- 애매한 경우 → consultation (기본)

반드시 아래 JSON 형식으로만 응답하세요:
{"targetAgent": "에이전트코드", "reason": "판단 이유", "modifiedPrompt": "에이전트에 전달할 최적화된 프롬프트 (선택사항)"}`;

export class Orchestrator {
  private agents: Map<AgentRole, BaseAgent>;

  constructor() {
    this.agents = new Map([
      ["consultation", new ConsultationAgent()],
      ["image", new ImageAgent()],
      ["quote", new QuoteAgent()],
      ["schedule", new ScheduleAgent()],
    ]);
  }

  async process(
    userMessage: string,
    context: AgentContext,
  ): Promise<AgentResponse> {
    // 1. 오케스트레이터가 적절한 에이전트 결정
    const decision = await this.decide(userMessage, context);

    // 2. 해당 에이전트에 작업 위임
    const agent = this.agents.get(decision.targetAgent);
    if (!agent) {
      console.error(`Agent "${decision.targetAgent}" not found in registry`);
      return {
        message: "죄송합니다. 요청을 처리할 수 없습니다. 다시 시도해주세요.",
        agentRole: "orchestrator",
      };
    }

    const prompt = decision.modifiedPrompt || userMessage;

    try {
      const response = await agent.run(prompt, context);
      return {
        ...response,
        metadata: {
          ...response.metadata,
          orchestratorDecision: decision,
        },
      };
    } catch (error) {
      console.error(`Agent ${decision.targetAgent} error:`, error);
      return {
        message:
          "죄송합니다. 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        agentRole: decision.targetAgent,
      };
    }
  }

  private async decide(
    userMessage: string,
    context: AgentContext,
  ): Promise<OrchestratorDecision> {
    try {
      const contextSummary = this.buildContextSummary(context);

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 256,
        system: ORCHESTRATOR_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `${contextSummary}\n\n사용자 메시지: "${userMessage}"`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      // JSON 파싱 (안전하게)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const targetAgent = parsed.targetAgent as AgentRole;

          // 유효한 에이전트인지 검증
          if (VALID_AGENTS.includes(targetAgent)) {
            return {
              targetAgent,
              reason: parsed.reason || "",
              modifiedPrompt: parsed.modifiedPrompt,
            };
          }
          console.warn(`Invalid agent "${targetAgent}", falling back to consultation`);
        } catch (parseError) {
          console.error("Orchestrator JSON parse error:", parseError);
        }
      }
    } catch (error) {
      console.error("Orchestrator decision error:", error);
    }

    // 기본: 상담 에이전트
    return {
      targetAgent: "consultation",
      reason: "기본 라우팅",
    };
  }

  private buildContextSummary(context: AgentContext): string {
    const parts: string[] = [];

    if (context.projectId) {
      parts.push(`현재 프로젝트: ${context.projectId}`);
    }

    const recentMessages = context.conversationHistory.slice(-5);
    if (recentMessages.length > 0) {
      parts.push("최근 대화:");
      for (const msg of recentMessages) {
        const roleLabel = msg.agentRole
          ? `[${msg.agentRole}]`
          : `[${msg.role}]`;
        parts.push(`${roleLabel} ${msg.content.slice(0, 100)}`);
      }
    }

    const sessionKeys = Object.keys(context.sessionData);
    if (sessionKeys.length > 0) {
      parts.push(`세션 데이터: ${sessionKeys.join(", ")}`);
    }

    return parts.length > 0
      ? `[컨텍스트]\n${parts.join("\n")}`
      : "[컨텍스트 없음]";
  }
}

// 싱글턴
let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}
