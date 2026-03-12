import { NextRequest, NextResponse } from "next/server";
import { getOrchestrator } from "@/lib/ai/agents/orchestrator";
import type { AgentContext, AgentMessage } from "@/lib/ai/agents/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      conversationHistory = [],
      projectId,
      sessionData = {},
    } = body as {
      message: string;
      conversationHistory?: AgentMessage[];
      projectId?: string;
      sessionData?: Record<string, unknown>;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "메시지가 필요합니다." },
        { status: 400 },
      );
    }

    // TODO: 인증된 사용자 ID 가져오기 (Supabase 연동 후)
    const userId = "temp-user";

    const context: AgentContext = {
      userId,
      projectId,
      conversationHistory,
      sessionData,
    };

    const orchestrator = getOrchestrator();
    const response = await orchestrator.process(message, context);

    return NextResponse.json({
      success: true,
      response: {
        message: response.message,
        agentRole: response.agentRole,
        toolResults: response.toolResults,
        imageUrl: response.imageUrl,
        metadata: response.metadata,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
