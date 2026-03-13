"use server";

import { requireAuth } from "@/lib/actions/auth-guard";

export async function getDashboardStats() {
  const { supabase, user } = await requireAuth();

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startDate = `${thisMonth}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const endDate = `${thisMonth}-${String(lastDay).padStart(2, "0")}`;
  const today = now.toISOString().slice(0, 10);

  const [projectsRes, schedulesRes, financeRes, imagesRes] = await Promise.all([
    supabase.from("projects").select("id, status").eq("owner_id", user.id),
    supabase
      .from("schedules")
      .select("id")
      .eq("owner_id", user.id)
      .gte("scheduled_date", today)
      .order("scheduled_date", { ascending: true })
      .limit(100),
    supabase
      .from("financial_transactions")
      .select("type, amount")
      .eq("owner_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate),
    supabase
      .from("ai_generated_images")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", `${thisMonth}-01T00:00:00`)
      .lt("created_at", `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01T00:00:00`),
  ]);

  const projects = projectsRes.data || [];
  const activeStatuses = ["consultation", "measuring", "designing", "quoting", "confirmed", "ordering", "manufacturing", "installing"];
  const activeProjects = projects.filter((p) => activeStatuses.includes(p.status));

  let monthIncome = 0;
  let monthExpense = 0;
  for (const row of financeRes.data || []) {
    if (row.type === "income") monthIncome += row.amount;
    else monthExpense += row.amount;
  }

  return {
    activeProjects: activeProjects.length,
    totalProjects: projects.length,
    upcomingSchedules: schedulesRes.data?.length || 0,
    monthIncome,
    monthExpense,
    monthProfit: monthIncome - monthExpense,
    monthImageCount: imagesRes.data?.length || 0,
    month: thisMonth,
  };
}

export async function getRecentProjects() {
  const { supabase, user } = await requireAuth();
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status, updated_at, customer:customers(id, name)")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return data;
}

export async function getUpcomingSchedules() {
  const { supabase, user } = await requireAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("schedules")
    .select("id, title, scheduled_date, schedule_type, project:projects(id, title)")
    .eq("owner_id", user.id)
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .limit(5);
  if (error) throw error;
  return data;
}

export async function getMonthlyRevenueChart() {
  const { supabase, user } = await requireAuth();

  // 최근 6개월 데이터
  const now = new Date();
  const months: { month: string; startDate: string; endDate: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const monthStr = `${y}-${String(m).padStart(2, "0")}`;
    const lastDayNum = new Date(y, m, 0).getDate();
    months.push({
      month: monthStr,
      startDate: `${monthStr}-01`,
      endDate: `${monthStr}-${String(lastDayNum).padStart(2, "0")}`,
    });
  }

  const { data, error } = await supabase
    .from("financial_transactions")
    .select("type, amount, transaction_date")
    .eq("owner_id", user.id)
    .gte("transaction_date", months[0].startDate)
    .lte("transaction_date", months[months.length - 1].endDate);

  if (error) throw error;

  return months.map(({ month, startDate, endDate }) => {
    let income = 0;
    let expense = 0;
    for (const row of data || []) {
      if (row.transaction_date >= startDate && row.transaction_date <= endDate) {
        if (row.type === "income") income += row.amount;
        else expense += row.amount;
      }
    }
    const [, m] = month.split("-");
    return { name: `${Number(m)}월`, income, expense };
  });
}

export async function getProjectStatusDistribution() {
  const { supabase, user } = await requireAuth();
  const { data, error } = await supabase
    .from("projects")
    .select("status")
    .eq("owner_id", user.id);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }

  const STATUS_LABELS: Record<string, string> = {
    consultation: "상담",
    measuring: "실측",
    designing: "설계",
    quoting: "견적",
    confirmed: "확정",
    ordering: "발주",
    manufacturing: "제작",
    installing: "설치",
    completed: "완료",
    after_service: "A/S",
  };

  return Object.entries(counts).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
  }));
}
