"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-guard";

export async function getSchedules(filters?: {
  month?: string;
  projectId?: string;
}) {
  const { supabase } = await requireAuth();

  let query = supabase
    .from("schedules")
    .select("*, project:projects(id, title, status)")
    .order("scheduled_date", { ascending: true });

  if (filters?.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const startDate = `${filters.month}-01`;
    const [year, month] = filters.month.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${filters.month}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("scheduled_date", startDate).lte("scheduled_date", endDate);
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createSchedule(formData: FormData) {
  const { supabase, user } = await requireAuth();

  const projectId = (formData.get("project_id") as string)?.trim();
  const title = (formData.get("title") as string)?.trim();
  const type = (formData.get("type") as string)?.trim();
  const scheduledDate = (formData.get("scheduled_date") as string)?.trim();

  if (!projectId || !title || !type || !scheduledDate) {
    throw new Error("프로젝트, 유형, 제목, 날짜는 필수입니다.");
  }

  const validTypes = [
    "consultation", "measuring", "design_review",
    "manufacturing_start", "manufacturing_end",
    "delivery", "installation", "after_service",
  ];
  if (!validTypes.includes(type)) {
    throw new Error("잘못된 일정 유형입니다.");
  }

  const { error } = await supabase.from("schedules").insert({
    owner_id: user.id,
    project_id: projectId,
    type,
    title,
    scheduled_date: scheduledDate,
    scheduled_time_start: (formData.get("scheduled_time_start") as string)?.trim() || null,
    scheduled_time_end: (formData.get("scheduled_time_end") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
  });

  if (error) throw error;
  revalidatePath("/schedule");
}

export async function updateScheduleStatus(
  id: string,
  status: "scheduled" | "in_progress" | "completed" | "canceled",
) {
  const { supabase } = await requireAuth();

  const validStatuses = ["scheduled", "in_progress", "completed", "canceled"];
  if (!validStatuses.includes(status)) {
    throw new Error("잘못된 상태값입니다.");
  }

  const { error } = await supabase
    .from("schedules")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/schedule");
}

export async function deleteSchedule(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/schedule");
}
