// ============================================
// 공통 타입
// ============================================

export type UserRole = "customer" | "business" | "factory" | "admin";

export type FurnitureType =
  | "sink"
  | "built_in_closet"
  | "shoe_cabinet"
  | "vanity"
  | "fridge_cabinet"
  | "storage"
  | "other";

export const FURNITURE_TYPE_LABELS: Record<FurnitureType, string> = {
  sink: "싱크대",
  built_in_closet: "붙박이장",
  shoe_cabinet: "신발장",
  vanity: "화장대",
  fridge_cabinet: "냉장고장",
  storage: "수납장",
  other: "기타",
};

export type ProjectStatus =
  | "consultation"
  | "measuring"
  | "designing"
  | "quoting"
  | "confirmed"
  | "ordering"
  | "manufacturing"
  | "installing"
  | "completed"
  | "after_service";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  consultation: "상담",
  measuring: "실측",
  designing: "설계/디자인",
  quoting: "견적",
  confirmed: "확정",
  ordering: "발주",
  manufacturing: "제작",
  installing: "설치",
  completed: "완료",
  after_service: "A/S",
};

export type ScheduleType =
  | "consultation"
  | "measuring"
  | "design_review"
  | "manufacturing_start"
  | "manufacturing_end"
  | "delivery"
  | "installation"
  | "after_service";

export type SubscriptionPlan = "free" | "basic" | "pro" | "pro_plus";

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: "무료",
  basic: "기본",
  pro: "프로",
  pro_plus: "프로+",
};

export type TransactionType = "income" | "expense";

export type AIImageStatus = "pending" | "processing" | "completed" | "failed";

// ============================================
// 프로필
// ============================================
export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  company_name: string | null;
  business_number: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 고객
// ============================================
export interface Customer {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  address_detail: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 프로젝트
// ============================================
export interface Project {
  id: string;
  owner_id: string;
  customer_id: string | null;
  title: string;
  status: ProjectStatus;
  address: string | null;
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

// ============================================
// 주문 품목
// ============================================
export interface OrderItem {
  id: string;
  project_id: string;
  furniture_type: FurnitureType;
  furniture_type_label: string | null;
  width_mm: number | null;
  height_mm: number | null;
  depth_mm: number | null;
  material: string | null;
  material_detail: Record<string, string> | null;
  color: string | null;
  hardware: Record<string, string> | null;
  quantity: number;
  unit_price: number;
  notes: string | null;
  created_at: string;
}

// ============================================
// AI 이미지
// ============================================
export interface AIImage {
  id: string;
  project_id: string | null;
  user_id: string;
  source_image_url: string;
  generated_image_url: string | null;
  furniture_type: string;
  prompt: string | null;
  parameters: Record<string, unknown> | null;
  status: AIImageStatus;
  error_message: string | null;
  from_drawing: boolean;
  drawing_id: string | null;
  created_at: string;
}

// ============================================
// 견적
// ============================================
export interface Quote {
  id: string;
  project_id: string;
  version: number;
  items: QuoteItem[];
  material_cost: number;
  labor_cost: number;
  delivery_cost: number;
  misc_cost: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  is_final: boolean;
  created_at: string;
}

export interface QuoteItem {
  name: string;
  furniture_type: FurnitureType;
  specification: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

// ============================================
// 일정
// ============================================
export interface Schedule {
  id: string;
  project_id: string;
  type: ScheduleType;
  title: string;
  scheduled_date: string;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  assigned_to: string | null;
  status: "scheduled" | "in_progress" | "completed" | "canceled";
  notes: string | null;
  created_at: string;
}

// ============================================
// 매출/매입
// ============================================
export interface FinancialTransaction {
  id: string;
  owner_id: string;
  project_id: string | null;
  type: TransactionType;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  receipt_url: string | null;
  created_at: string;
}

// ============================================
// 구독
// ============================================
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string | null;
  created_at: string;
}
