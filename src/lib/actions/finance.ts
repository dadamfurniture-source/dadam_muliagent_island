"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-guard";

// 매출매입 목록 조회
export async function getTransactions(filters?: {
  month?: string;
  type?: "income" | "expense";
  projectId?: string;
}) {
  const { supabase } = await requireAuth();

  let query = supabase
    .from("financial_transactions")
    .select("*, project:projects(id, title)")
    .order("transaction_date", { ascending: false });

  if (filters?.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(filters.month)) {
    const startDate = `${filters.month}-01`;
    const [year, month] = filters.month.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${filters.month}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("transaction_date", startDate).lte("transaction_date", endDate);
  }

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// 월별 요약 통계
export async function getMonthlySummary(month?: string) {
  const { supabase } = await requireAuth();

  const targetMonth = month || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    throw new Error("잘못된 월 형식입니다.");
  }

  const startDate = `${targetMonth}-01`;
  const [year, m] = targetMonth.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  const endDate = `${targetMonth}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("financial_transactions")
    .select("type, amount")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  if (error) throw error;

  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of data || []) {
    if (row.type === "income") {
      totalIncome += row.amount;
    } else {
      totalExpense += row.amount;
    }
  }

  return {
    month: targetMonth,
    income: totalIncome,
    expense: totalExpense,
    profit: totalIncome - totalExpense,
  };
}

// 거래 등록
export async function createTransaction(formData: FormData) {
  const { supabase, user } = await requireAuth();

  const type = (formData.get("type") as string)?.trim();
  const category = (formData.get("category") as string)?.trim();
  const amountStr = (formData.get("amount") as string)?.trim();
  const transactionDate = (formData.get("transaction_date") as string)?.trim();

  if (!type || !category || !amountStr || !transactionDate) {
    throw new Error("유형, 카테고리, 금액, 날짜는 필수입니다.");
  }

  if (type !== "income" && type !== "expense") {
    throw new Error("잘못된 거래 유형입니다.");
  }

  const amount = Math.max(0, Math.round(Number(amountStr)));
  if (!amount || amount <= 0) {
    throw new Error("금액은 0보다 커야 합니다.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
    throw new Error("잘못된 날짜 형식입니다.");
  }

  const [yr, mo, dy] = transactionDate.split("-").map(Number);
  const dateObj = new Date(yr, mo - 1, dy);
  if (dateObj.getFullYear() !== yr || dateObj.getMonth() !== mo - 1 || dateObj.getDate() !== dy) {
    throw new Error("존재하지 않는 날짜입니다.");
  }

  const projectId = (formData.get("project_id") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;
  const paymentMethod = (formData.get("payment_method") as string)?.trim() || null;

  const { error } = await supabase.from("financial_transactions").insert({
    owner_id: user.id,
    type,
    category,
    amount,
    transaction_date: transactionDate,
    project_id: projectId,
    description,
    payment_method: paymentMethod,
  });

  if (error) throw error;
  revalidatePath("/finance");
}

// 거래 삭제
export async function deleteTransaction(id: string) {
  const { supabase, user } = await requireAuth();
  const { error } = await supabase
    .from("financial_transactions")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);
  if (error) throw error;
  revalidatePath("/finance");
}
