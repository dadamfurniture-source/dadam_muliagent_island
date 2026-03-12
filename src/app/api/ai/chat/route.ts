import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrchestrator } from "@/lib/ai/agents/orchestrator";
import type { AgentContext, AgentMessage } from "@/lib/ai/agents/types";
import { createClient } from "@/lib/supabase/server";

const chatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "메시지는 비어있을 수 없습니다")
    .max(2000, "메시지는 2000자 이하여야 합니다"),
  conversationHistory: z
    .array(z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      agentRole: z.string().optional(),
      imageUrl: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      createdAt: z.string(),
    }))
    .max(50, "대화 히스토리는 50개를 초과할 수 없습니다")
    .optional()
    .default([]),
  projectId: z.string().uuid().optional(),
  sessionData: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }

    // 2. 입력 검증
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "잘못된 입력입니다.", details: parseResult.error.issues },
        { status: 400 },
      );
    }

    const { message, conversationHistory, projectId, sessionData } =
      parseResult.data;

    // 3. 에이전트 실행
    const context: AgentContext = {
      userId: user.id,
      projectId,
      conversationHistory: conversationHistory as AgentMessage[],
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
