"use server";

import { requireAuth } from "@/lib/actions/auth-guard";

export async function getNotifications(options?: { unreadOnly?: boolean; limit?: number }) {
  const { supabase } = await requireAuth();

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit || 20);

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getUnreadCount() {
  const { supabase } = await requireAuth();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);
  if (error) throw error;
  return count || 0;
}

export async function markAsRead(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllAsRead() {
  const { supabase } = await requireAuth();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

export async function createNotification(params: {
  userId: string;
  type: "schedule_reminder" | "project_status" | "payment" | "quote_ready" | "image_ready" | "system";
  title: string;
  message?: string;
  link?: string;
}) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("notifications").insert({
    owner_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message || null,
    link: params.link || null,
  });
  if (error) throw error;
}
