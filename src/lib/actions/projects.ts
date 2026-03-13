"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-guard";
import { escapeIlike } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

export async function getProjects(filters?: {
  status?: ProjectStatus;
  search?: string;
}) {
  const { supabase } = await requireAuth();
  let query = supabase
    .from("projects")
    .select("*, customer:customers(id, name, phone)")
    .order("updated_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    const s = escapeIlike(filters.search);
    query = query.or(
      `title.ilike.%${s}%,address.ilike.%${s}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProject(id: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from("projects")
    .select("*, customer:customers(id, name, phone, address)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectItems(projectId: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireAuth();

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("프로젝트명은 필수입니다.");

  const customerId = (formData.get("customer_id") as string)?.trim();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      customer_id: customerId || null,
      title,
      address: (formData.get("address") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/projects");
  return data;
}

export async function updateProject(id: string, formData: FormData) {
  const { supabase } = await requireAuth();

  const title = (formData.get("title") as string)?.trim();
  if (!title) throw new Error("프로젝트명은 필수입니다.");

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      customer_id: (formData.get("customer_id") as string)?.trim() || null,
      address: (formData.get("address") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const { supabase, user } = await requireAuth();

  const validStatuses: ProjectStatus[] = [
    "consultation", "measuring", "designing", "quoting",
    "confirmed", "ordering", "manufacturing",
    "installing", "completed", "after_service",
  ];
  if (!validStatuses.includes(status)) {
    throw new Error("잘못된 상태값입니다.");
  }

  // 프로젝트 제목 조회 (알림용)
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);

  if (error) throw error;

  // 상태 변경 알림 생성
  const STATUS_LABELS: Record<string, string> = {
    consultation: "상담", measuring: "실측", designing: "설계/디자인",
    quoting: "견적", confirmed: "확정", ordering: "발주",
    manufacturing: "제작", installing: "설치", completed: "완료",
    after_service: "A/S",
  };
  const label = STATUS_LABELS[status] || status;
  const title = project?.title || "프로젝트";
  await supabase.from("notifications").insert({
    owner_id: user.id,
    type: "project_status",
    title: `${title} - ${label} 단계로 변경`,
    message: `프로젝트가 "${label}" 단계로 변경되었습니다.`,
    link: `/projects/${id}`,
  }).then(() => {});

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/projects");
}

export async function addOrderItem(projectId: string, formData: FormData) {
  const { supabase } = await requireAuth();

  const furnitureType = (formData.get("furniture_type") as string)?.trim();
  if (!furnitureType) throw new Error("가구 유형은 필수입니다.");

  const widthMm = Number(formData.get("width_mm")) || null;
  const heightMm = Number(formData.get("height_mm")) || null;
  const depthMm = Number(formData.get("depth_mm")) || null;
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const unitPrice = Math.max(0, Number(formData.get("unit_price")) || 0);

  const { error } = await supabase.from("order_items").insert({
    project_id: projectId,
    furniture_type: furnitureType,
    furniture_type_label: (formData.get("furniture_type_label") as string)?.trim() || null,
    width_mm: widthMm && widthMm > 0 ? widthMm : null,
    height_mm: heightMm && heightMm > 0 ? heightMm : null,
    depth_mm: depthMm && depthMm > 0 ? depthMm : null,
    material: (formData.get("material") as string)?.trim() || null,
    color: (formData.get("color") as string)?.trim() || null,
    quantity,
    unit_price: unitPrice,
    notes: (formData.get("notes") as string)?.trim() || null,
  });

  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteOrderItem(id: string, projectId: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("order_items").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}
