-- ============================================
-- FurniAI 초기 스키마
-- ============================================

-- 1. 프로필
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  business_number TEXT,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'business', 'factory', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 구독 플랜
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  ai_image_limit INTEGER DEFAULT 5,
  agent_chat_limit INTEGER DEFAULT 20,
  drawing_enabled BOOLEAN DEFAULT false,
  drawing_image_gen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 구독
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 고객
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  address_detail TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 프로젝트
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'consultation'
    CHECK (status IN (
      'consultation', 'measuring', 'designing', 'quoting',
      'confirmed', 'ordering', 'manufacturing',
      'installing', 'completed', 'after_service'
    )),
  address TEXT,
  notes TEXT,
  total_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 주문 품목
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  furniture_type TEXT NOT NULL
    CHECK (furniture_type IN (
      'sink', 'built_in_closet', 'shoe_cabinet',
      'vanity', 'fridge_cabinet', 'storage', 'other'
    )),
  furniture_type_label TEXT,
  width_mm INTEGER,
  height_mm INTEGER,
  depth_mm INTEGER,
  material TEXT,
  material_detail JSONB,
  color TEXT,
  hardware JSONB,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AI 이미지
CREATE TABLE public.ai_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_image_url TEXT NOT NULL,
  generated_image_url TEXT,
  furniture_type TEXT NOT NULL,
  prompt TEXT,
  parameters JSONB,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  from_drawing BOOLEAN DEFAULT false,
  drawing_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. 견적
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  items JSONB NOT NULL DEFAULT '[]',
  material_cost INTEGER DEFAULT 0,
  labor_cost INTEGER DEFAULT 0,
  delivery_cost INTEGER DEFAULT 0,
  misc_cost INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  notes TEXT,
  is_final BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. 도면
CREATE TABLE public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  title TEXT,
  drawing_data JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. 일정
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN (
      'consultation', 'measuring', 'design_review',
      'manufacturing_start', 'manufacturing_end',
      'delivery', 'installation', 'after_service'
    )),
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. 매출/매입
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. AI 사용량
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image_gen', 'chat', 'quote_assist', 'drawing_gen')),
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX idx_customers_owner ON public.customers(owner_id);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_customer ON public.projects(customer_id);
CREATE INDEX idx_order_items_project ON public.order_items(project_id);
CREATE INDEX idx_schedules_owner ON public.schedules(owner_id);
CREATE INDEX idx_schedules_date ON public.schedules(scheduled_date);
CREATE INDEX idx_schedules_project ON public.schedules(project_id);
CREATE INDEX idx_financial_owner ON public.financial_transactions(owner_id);
CREATE INDEX idx_financial_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_ai_images_user ON public.ai_images(user_id);
CREATE INDEX idx_ai_images_project ON public.ai_images(project_id);
CREATE INDEX idx_ai_usage_user ON public.ai_usage(user_id);

-- ============================================
-- RLS 정책
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 프로필: 본인만 조회/수정
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 고객: 소유자만 CRUD
CREATE POLICY customers_all ON public.customers FOR ALL USING (auth.uid() = owner_id);

-- 프로젝트: 소유자만 CRUD
CREATE POLICY projects_all ON public.projects FOR ALL USING (auth.uid() = owner_id);

-- 주문 품목: 프로젝트 소유자만
CREATE POLICY order_items_all ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = order_items.project_id AND owner_id = auth.uid()));

-- 일정: 소유자만
CREATE POLICY schedules_all ON public.schedules FOR ALL USING (auth.uid() = owner_id);

-- 견적: 프로젝트 소유자만
CREATE POLICY quotes_all ON public.quotes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = quotes.project_id AND owner_id = auth.uid()));

-- 도면: 프로젝트 소유자만
CREATE POLICY drawings_all ON public.drawings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.projects WHERE id = drawings.project_id AND owner_id = auth.uid()));

-- AI 이미지: 본인만
CREATE POLICY ai_images_all ON public.ai_images FOR ALL USING (auth.uid() = user_id);

-- 매출매입: 소유자만
CREATE POLICY financial_all ON public.financial_transactions FOR ALL USING (auth.uid() = owner_id);

-- AI 사용량: 본인만
CREATE POLICY ai_usage_all ON public.ai_usage FOR ALL USING (auth.uid() = user_id);

-- 구독: 본인만
CREATE POLICY subscriptions_all ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- 구독 플랜: 누구나 조회
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY plans_select ON public.subscription_plans FOR SELECT USING (true);

-- ============================================
-- 초기 데이터: 구독 플랜
-- ============================================
INSERT INTO public.subscription_plans (name, display_name, price_monthly, price_yearly, ai_image_limit, agent_chat_limit, drawing_enabled, drawing_image_gen, features) VALUES
  ('free', '무료', 0, 0, 3, 20, false, false, '{"basic_consultation": true}'),
  ('basic', '기본', 12900, 123800, 10, 100, false, false, '{"basic_consultation": true, "advanced_quote": true}'),
  ('pro', '프로', 39900, 383000, 30, -1, true, false, '{"basic_consultation": true, "advanced_quote": true, "drawing": true}'),
  ('pro_plus', '프로+', 79900, 767000, 100, -1, true, true, '{"basic_consultation": true, "advanced_quote": true, "drawing": true, "drawing_to_image": true}');

-- ============================================
-- 트리거: updated_at 자동 갱신
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER drawings_updated_at BEFORE UPDATE ON public.drawings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
