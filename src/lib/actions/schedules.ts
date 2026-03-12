"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSchedules(filters?: {
  month?: string; // YYYY-MM
  projectId?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  let query = supabase
    .from("schedules")
    .select("*, project:projects(id, title, status)")
    .eq("owner_id", user.id)
    .order("scheduled_date", { ascending: true });

  if (filters?.month) {
    const startDate = `${filters.month}-01`;
    const [year, month] = filters.month.split("-").map(Number);
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("schedules").insert({
    owner_id: user.id,
    project_id: formData.get("project_id") as string,
    type: formData.get("type") as string,
    title: formData.get("title") as string,
    scheduled_date: formData.get("scheduled_date") as string,
    scheduled_time_start: (formData.get("scheduled_time_start") as string) || null,
    scheduled_time_end: (formData.get("scheduled_time_end") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw error;
  revalidatePath("/schedule");
}

export async function updateScheduleStatus(
  id: string,
  status: "scheduled" | "in_progress" | "completed" | "canceled",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("schedules")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/schedule");
}

export async function deleteSchedule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/schedule");
}
