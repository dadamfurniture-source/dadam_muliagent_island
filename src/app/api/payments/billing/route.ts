import { NextResponse } from "next/server";
import { getStripe } from "@/lib/payments/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "결제 이력이 없습니다." },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "결제 관리 페이지 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
