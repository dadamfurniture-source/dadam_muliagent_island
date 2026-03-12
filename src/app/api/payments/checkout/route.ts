import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, PLAN_PRICE_IDS, getOrCreateStripeCustomer } from "@/lib/payments/stripe";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  plan: z.enum(["basic", "pro", "pro_plus"]),
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = checkoutSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "잘못된 입력입니다." }, { status: 400 });
    }

    const { plan, interval } = parseResult.data;

    // Price ID 확인
    const priceId = PLAN_PRICE_IDS[plan]?.[interval];
    if (!priceId) {
      return NextResponse.json(
        { error: "해당 플랜의 가격 정보가 설정되지 않았습니다." },
        { status: 400 },
      );
    }

    // Stripe Customer 조회 또는 생성
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const customerId = await getOrCreateStripeCustomer(
      user.email!,
      user.id,
      profile?.stripe_customer_id,
    );

    // Stripe Customer ID 저장
    if (!profile?.stripe_customer_id) {
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Checkout 세션 생성
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/subscription?success=true`,
      cancel_url: `${appUrl}/settings/subscription?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan_name: plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_name: plan,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      automatic_tax: { enabled: true },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "결제 세션 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
