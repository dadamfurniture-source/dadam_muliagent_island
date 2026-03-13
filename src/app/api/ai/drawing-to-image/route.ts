import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateFurnitureImage } from "@/lib/ai/gemini";
import { checkRateLimit, RATE_LIMITS } from "@/lib/cloudflare/rate-limit";

// 프롬프트 인젝션 방지: 줄바꿈/제어문자 제거, 길이 제한
const sanitize = (s: string) => s.replace(/[\n\r\t\x00-\x1f]/g, " ").trim().slice(0, 100);

const requestSchema = z.object({
  drawingImageBase64: z.string().min(1),
  drawingId: z.string().uuid(),
  furnitureType: z.string().min(1).max(50),
  style: z.string().max(50).optional(),
  material: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 레이트 리밋
    const rateResult = checkRateLimit(`image:${user.id}`, RATE_LIMITS.imageGen);
    if (!rateResult.success) {
      return NextResponse.json(
        { error: "이미지 생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    // 프로+ 플랜 확인
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan:subscription_plans(drawing_image_gen)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const plan = subscription?.plan as unknown as { drawing_image_gen: boolean } | null;
    if (!plan?.drawing_image_gen) {
      return NextResponse.json(
        { error: "도면→이미지 생성은 프로+ 플랜에서만 사용 가능합니다." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "잘못된 입력입니다." }, { status: 400 });
    }

    const { drawingImageBase64, drawingId, furnitureType, style, material, color, description } =
      parseResult.data;

    // 도면 이미지를 기반으로 가구 3D 렌더링 프롬프트 생성
    const promptParts = [
      `이 도면을 기반으로 ${furnitureType} 가구의 사실적인 3D 렌더링 이미지를 생성해주세요.`,
      "도면의 구조, 치수, 비율을 정확히 반영하세요.",
    ];

    if (style) promptParts.push(`스타일: ${sanitize(style)}`);
    if (material) promptParts.push(`자재: ${sanitize(material)}, 재질감을 사실적으로 표현하세요.`);
    if (color) promptParts.push(`색상: ${sanitize(color)}`);
    if (description) promptParts.push(`추가 설명: ${sanitize(description)}`);

    promptParts.push(
      "조명과 그림자가 자연스러운 고품질 제품 사진 스타일로 렌더링하세요.",
      "배경은 깨끗한 실내 공간으로 설정하세요.",
    );

    const prompt = promptParts.join("\n");

    // Gemini로 이미지 생성
    const result = await generateFurnitureImage(
      drawingImageBase64,
      "image/png",
      prompt,
    );

    if (!result.imageBase64 || !result.mimeType) {
      return NextResponse.json(
        { error: "이미지 생성에 실패했습니다." },
        { status: 500 },
      );
    }

    // 생성 이미지 저장
    const buffer = Buffer.from(result.imageBase64, "base64");
    const ext = result.mimeType.split("/")[1] || "png";
    const fileName = `${user.id}/drawing-gen/${drawingId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(fileName, buffer, {
        contentType: result.mimeType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "이미지 저장에 실패했습니다." },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(fileName);

    // ai_images에 레코드 저장
    await supabase.from("ai_images").insert({
      user_id: user.id,
      source_image_url: `drawing:${drawingId}`,
      generated_image_url: urlData.publicUrl,
      furniture_type: furnitureType,
      prompt,
      status: "completed",
      from_drawing: true,
      drawing_id: drawingId,
    });

    // 사용량 기록
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      type: "drawing_gen",
      metadata: { drawing_id: drawingId, furniture_type: furnitureType },
    });

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      description: result.text,
    });
  } catch (error) {
    console.error("Drawing to image error:", error);
    return NextResponse.json(
      { error: "이미지 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
