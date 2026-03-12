"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-guard";

// 프로젝트의 도면 목록 조회
export async function getDrawings(projectId: string) {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from("drawings")
    .select("id, project_id, order_item_id, title, thumbnail_url, version, created_at, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

// 도면 단일 조회 (drawing_data 포함)
export async function getDrawing(id: string) {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from("drawings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// 도면 생성
export async function createDrawing(projectId: string, title?: string) {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from("drawings")
    .insert({
      project_id: projectId,
      title: title?.trim() || "새 도면",
      drawing_data: { elements: [], appState: {}, files: {} },
      version: 1,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
  return data;
}

// 도면 데이터 저장 (자동 저장)
export async function saveDrawing(
  id: string,
  drawingData: Record<string, unknown>,
  thumbnailUrl?: string,
) {
  const { supabase } = await requireAuth();

  const updateData: Record<string, unknown> = {
    drawing_data: drawingData,
  };
  if (thumbnailUrl) {
    updateData.thumbnail_url = thumbnailUrl;
  }

  const { error } = await supabase
    .from("drawings")
    .update(updateData)
    .eq("id", id);

  if (error) throw error;
}

// 도면 제목 변경
export async function updateDrawingTitle(id: string, title: string) {
  const { supabase } = await requireAuth();

  const trimmed = title.trim();
  if (!trimmed) throw new Error("제목은 필수입니다.");

  const { error } = await supabase
    .from("drawings")
    .update({ title: trimmed })
    .eq("id", id);

  if (error) throw error;
}

// 도면 삭제
export async function deleteDrawing(id: string, projectId: string) {
  const { supabase } = await requireAuth();

  const { error } = await supabase.from("drawings").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}
