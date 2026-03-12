"use server";

import { requireAuth } from "@/lib/actions/auth-guard";

// 구독 플랜 목록 조회
export async function getSubscriptionPlans() {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("price_monthly", { ascending: true });

  if (error) throw error;
  return data;
}

// 현재 사용자의 구독 정보 조회
export async function getCurrentSubscription() {
  const { supabase, user } = await requireAuth();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
  return data;
}

// 사용자의 현재 플랜명 조회
export async function getCurrentPlanName(): Promise<string> {
  const { supabase, user } = await requireAuth();

  const { data } = await supabase
    .from("subscriptions")
    .select("plan:subscription_plans(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const plan = data?.plan as unknown as { name: string } | null;
  return plan?.name || "free";
}

// AI 사용량 조회 (이번 달)
export async function getMonthlyUsage() {
  const { supabase, user } = await requireAuth();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("ai_usage")
    .select("type")
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth);

  if (error) throw error;

  const usage = {
    image_gen: 0,
    chat: 0,
    quote_assist: 0,
    drawing_gen: 0,
  };

  for (const row of data || []) {
    if (row.type in usage) {
      usage[row.type as keyof typeof usage]++;
    }
  }

  return usage;
}
