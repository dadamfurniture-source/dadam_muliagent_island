"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-guard";
import { generateFurnitureImage } from "@/lib/ai/gemini";
import { buildFurnitureImagePrompt } from "@/lib/ai/prompts/image";
import type { FurnitureType, AIImageStatus } from "@/types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 월별 이미지 생성 사용량 조회
export async function getImageUsageThisMonth() {
  const { supabase, user } = await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "image_gen")
    .gte("created_at", startOfMonth);

  if (error) throw error;
  return count ?? 0;
}

// 사용자의 AI 이미지 목록 조회
export async function getAIImages(filters?: {
  projectId?: string;
  status?: AIImageStatus;
  limit?: number;
}) {
  const { supabase } = await requireAuth();

  let query = supabase
    .from("ai_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// 현장사진 업로드 → Supabase Storage
export async function uploadSourceImage(formData: FormData) {
  const { supabase, user } = await requireAuth();

  const file = formData.get("file") as File;
  if (!file) throw new Error("파일이 필요합니다.");

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("JPG, PNG, WebP 형식만 지원합니다.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("파일 크기는 10MB 이하여야 합니다.");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("source-images")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error("파일 업로드에 실패했습니다.");

  const { data: urlData } = supabase.storage
    .from("source-images")
    .getPublicUrl(fileName);

  return {
    url: urlData.publicUrl,
    path: fileName,
  };
}

// AI 이미지 생성 (현장사진 + 가구 합성)
export async function generateAIImage(params: {
  sourceImageBase64: string;
  sourceMimeType: string;
  sourceImageUrl: string;
  furnitureType: FurnitureType;
  style?: string;
  color?: string;
  material?: string;
  widthMm?: number;
  heightMm?: number;
  additionalNotes?: string;
  projectId?: string;
}) {
  const { supabase, user } = await requireAuth();

  // 1. 사용량 체크 (구독 플랜 기반)
  const monthlyUsage = await getImageUsageThisMonth();
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_id, subscription_plans(image_limit)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  // subscription_plans는 join 결과 (단일 객체 또는 배열)
  const plans = subscription?.subscription_plans as unknown as { image_limit: number } | null;
  const imageLimit = plans?.image_limit ?? 3;
  if (monthlyUsage >= imageLimit) {
    throw new Error(
      `이번 달 이미지 생성 한도(${imageLimit}회)에 도달했습니다. 플랜을 업그레이드해주세요.`,
    );
  }

  // 2. ai_images 레코드 생성 (pending)
  const prompt = buildFurnitureImagePrompt({
    furnitureType: params.furnitureType,
    style: params.style,
    color: params.color,
    material: params.material,
    widthMm: params.widthMm,
    heightMm: params.heightMm,
    additionalNotes: params.additionalNotes,
  });

  const { data: imageRecord, error: insertError } = await supabase
    .from("ai_images")
    .insert({
      user_id: user.id,
      project_id: params.projectId || null,
      source_image_url: params.sourceImageUrl,
      furniture_type: params.furnitureType,
      prompt,
      parameters: {
        style: params.style,
        color: params.color,
        material: params.material,
        widthMm: params.widthMm,
        heightMm: params.heightMm,
      },
      status: "processing",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  const imageId = imageRecord.id;

  try {
    // 3. Gemini 이미지 생성
    const result = await generateFurnitureImage(
      params.sourceImageBase64,
      params.sourceMimeType,
      prompt,
    );

    if (!result.imageBase64 || !result.mimeType) {
      throw new Error("이미지 생성에 실패했습니다.");
    }

    // 4. 생성 이미지를 Storage에 저장
    const buffer = Buffer.from(result.imageBase64, "base64");
    const ext = result.mimeType.split("/")[1] || "png";
    const generatedFileName = `${user.id}/generated/${imageId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(generatedFileName, buffer, {
        contentType: result.mimeType,
        upsert: false,
      });

    if (uploadError) throw new Error("생성된 이미지 저장에 실패했습니다.");

    const { data: urlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(generatedFileName);

    // 5. ai_images 상태 업데이트
    await supabase
      .from("ai_images")
      .update({
        generated_image_url: urlData.publicUrl,
        status: "completed",
      })
      .eq("id", imageId);

    // 6. 사용량 기록
    await supabase.from("ai_usage").insert({
      user_id: user.id,
      type: "image_gen",
      tokens_used: 0,
      cost_usd: 0,
      metadata: { image_id: imageId, furniture_type: params.furnitureType },
    });

    revalidatePath("/ai-studio");

    return {
      imageId,
      generatedImageUrl: urlData.publicUrl,
      description: result.text || null,
    };
  } catch (error) {
    // 실패 시 상태 업데이트
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    await supabase
      .from("ai_images")
      .update({
        status: "failed",
        error_message: errorMsg,
      })
      .eq("id", imageId);

    throw error;
  }
}

// AI 이미지 삭제
export async function deleteAIImage(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("ai_images").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/ai-studio");
}
