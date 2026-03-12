"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-guard";

// 프로젝트의 견적 목록 조회
export async function getQuotes(projectId: string) {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false });

  if (error) throw error;
  return data;
}

// 견적 단일 조회
export async function getQuote(id: string) {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from("quotes")
    .select("*, project:projects(id, title, customer:customers(id, name, phone, address))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// 자재비 기본 단가 (원/mm 기준 산출)
const BASE_PRICES: Record<string, number> = {
  sink: 800000,
  built_in_closet: 1500000,
  shoe_cabinet: 500000,
  vanity: 700000,
  fridge_cabinet: 500000,
  storage: 600000,
  other: 600000,
};

const MATERIAL_MULTIPLIER: Record<string, number> = {
  lpm: 1.0,
  pb: 1.0,
  mdf: 1.15,
  hpm: 1.15,
  pet: 1.2,
  melamine: 1.1,
  high_gloss: 1.4,
  하이그로시: 1.4,
  uv: 1.35,
  solid_wood: 2.2,
  원목: 2.2,
  ceramic: 3.0,
  세라믹: 3.0,
};

const FURNITURE_TYPE_LABELS: Record<string, string> = {
  sink: "싱크대",
  built_in_closet: "붙박이장",
  shoe_cabinet: "신발장",
  vanity: "화장대",
  fridge_cabinet: "냉장고장",
  storage: "수납장",
  other: "기타",
};

interface QuoteItem {
  name: string;
  furniture_type: string;
  specification: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

// 프로젝트 품목 기반 자동 견적 생성
export async function generateQuoteFromProject(projectId: string) {
  const { supabase } = await requireAuth();

  // 1. 프로젝트 품목 조회
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;
  if (!orderItems || orderItems.length === 0) {
    throw new Error("견적을 생성할 품목이 없습니다. 먼저 품목을 추가해주세요.");
  }

  // 2. 기존 최신 버전 확인
  const { data: latestQuote } = await supabase
    .from("quotes")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestQuote?.version ?? 0) + 1;

  // 3. 품목별 견적 계산
  const items: QuoteItem[] = [];
  let totalMaterialCost = 0;
  let totalLaborCost = 0;

  for (const item of orderItems) {
    const basePrice = BASE_PRICES[item.furniture_type] || 600000;
    const width = item.width_mm || 1000;
    const sizeMultiplier = Math.max(0.7, width / 1000);

    const materialKey = (item.material || "lpm").toLowerCase().replace(/\s/g, "_");
    const matMultiplier = MATERIAL_MULTIPLIER[materialKey] || 1.0;

    // 품목에 이미 단가가 있으면 그것을 우선 사용
    let unitPrice: number;
    if (item.unit_price > 0) {
      unitPrice = item.unit_price;
    } else {
      unitPrice = Math.round(basePrice * sizeMultiplier * matMultiplier);
    }

    const quantity = Math.max(1, item.quantity || 1);
    const amount = unitPrice * quantity;

    const specParts: string[] = [];
    if (item.width_mm) specParts.push(`W${item.width_mm}`);
    if (item.height_mm) specParts.push(`H${item.height_mm}`);
    if (item.depth_mm) specParts.push(`D${item.depth_mm}`);
    if (item.material) specParts.push(item.material);
    if (item.color) specParts.push(item.color);

    const label = item.furniture_type_label
      || FURNITURE_TYPE_LABELS[item.furniture_type]
      || item.furniture_type;

    items.push({
      name: label,
      furniture_type: item.furniture_type,
      specification: specParts.join(" / ") || "-",
      quantity,
      unit_price: unitPrice,
      amount,
    });

    totalMaterialCost += amount;
  }

  totalLaborCost = Math.round(totalMaterialCost * 0.25);
  const deliveryCost = 50000;
  const miscCost = 0;
  const discount = 0;
  const subtotal = totalMaterialCost + totalLaborCost + deliveryCost + miscCost - discount;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  // 4. 견적 저장
  const { data, error } = await supabase
    .from("quotes")
    .insert({
      project_id: projectId,
      version: nextVersion,
      items,
      material_cost: totalMaterialCost,
      labor_cost: totalLaborCost,
      delivery_cost: deliveryCost,
      misc_cost: miscCost,
      discount,
      tax,
      total,
      notes: `자동 생성 견적 (v${nextVersion}). AI 추정 기반이며, 실측 후 정확한 견적이 제공됩니다.`,
      is_final: false,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
  return data;
}

// 견적 확정
export async function finalizeQuote(id: string) {
  const { supabase } = await requireAuth();

  const { data: quote, error: fetchError } = await supabase
    .from("quotes")
    .select("project_id")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("quotes")
    .update({ is_final: true })
    .eq("id", id);

  if (error) throw error;
  revalidatePath(`/projects/${quote.project_id}`);
}

// 견적 삭제
export async function deleteQuote(id: string) {
  const { supabase } = await requireAuth();

  const { data: quote, error: fetchError } = await supabase
    .from("quotes")
    .select("project_id, is_final")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  if (quote.is_final) {
    throw new Error("확정된 견적은 삭제할 수 없습니다.");
  }

  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/projects/${quote.project_id}`);
}
