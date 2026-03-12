import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

// 플랜명 → Stripe Price ID 매핑 (환경변수로 관리)
export const PLAN_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || "",
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  },
  pro_plus: {
    monthly: process.env.STRIPE_PRICE_PRO_PLUS_MONTHLY || "",
    yearly: process.env.STRIPE_PRICE_PRO_PLUS_YEARLY || "",
  },
};

// Stripe Customer 생성 또는 조회
export async function getOrCreateStripeCustomer(
  email: string,
  userId: string,
  existingCustomerId?: string | null,
): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  return customer.id;
}
