-- profiles에 Stripe Customer ID 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- subscriptions에 Stripe 관련 필드 추가
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- subscription_plans에 Stripe Price ID 추가
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS stripe_price_monthly_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_yearly_id TEXT;
