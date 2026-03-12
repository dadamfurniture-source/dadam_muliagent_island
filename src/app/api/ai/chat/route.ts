import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrchestrator } from "@/lib/ai/agents/orchestrator";
import type { AgentContext, AgentMessage } from "@/lib/ai/agents/types";
import { createClient } from "@/lib/supabase/server";
import { generateAIImage } from "@/lib/actions/ai-images";
import type { FurnitureType } from "@/types";

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
  // 이미지 첨부 데이터
  imageData: z.object({
    base64: z.string(),
    mimeType: z.string(),
    url: z.string(),
  }).optional(),
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

    const { message, conversationHistory, projectId, sessionData, imageData } =
      parseResult.data;

    // 3. 이미지 첨부 시 세션에 저장
    const updatedSessionData = { ...sessionData };
    if (imageData) {
      updatedSessionData.uploadedImage = {
        base64: imageData.base64,
        mimeType: imageData.mimeType,
        url: imageData.url,
      };
    }

    // 4. 에이전트 실행
    const context: AgentContext = {
      userId: user.id,
      projectId,
      conversationHistory: conversationHistory as AgentMessage[],
      sessionData: updatedSessionData,
    };

    const orchestrator = getOrchestrator();
    const response = await orchestrator.process(message, context);

    // 5. 이미지 에이전트가 생성 요청한 경우 실제 생성 실행
    let generatedImageUrl: string | undefined;
    if (response.toolResults) {
      for (const tr of response.toolResults) {
        if (tr.tool === "request_image_generation" && typeof tr.result === "string") {
          try {
            const toolResult = JSON.parse(tr.result);
            if (toolResult.action === "generate_image" && imageData) {
              const genResult = await generateAIImage({
                sourceImageBase64: imageData.base64,
                sourceMimeType: imageData.mimeType,
                sourceImageUrl: imageData.url,
                furnitureType: toolResult.params.furnitureType as FurnitureType,
                style: toolResult.params.style,
                color: toolResult.params.color,
                material: toolResult.params.material,
                widthMm: toolResult.params.widthMm,
                heightMm: toolResult.params.heightMm,
                additionalNotes: toolResult.params.additionalNotes,
                projectId,
              });
              generatedImageUrl = genResult.generatedImageUrl;
            }
          } catch {
            // 이미지 생성 실패는 에러를 무시하고 텍스트 응답만 반환
            console.error("Image generation failed during chat");
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      response: {
        message: response.message,
        agentRole: response.agentRole,
        toolResults: response.toolResults,
        imageUrl: generatedImageUrl || response.imageUrl,
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
