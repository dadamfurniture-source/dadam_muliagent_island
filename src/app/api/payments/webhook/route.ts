import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const userId = session.metadata?.supabase_user_id;
          if (userId) {
            // Stripe Customer ID 저장
            await supabase
              .from("profiles")
              .update({ stripe_customer_id: session.customer as string })
              .eq("id", userId);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.parent?.subscription_details?.subscription === "string"
            ? invoice.parent.subscription_details.subscription
            : (invoice.parent?.subscription_details?.subscription as { id?: string })?.id;
        if (subId) {
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;
          if (customerId) {
            await getUserIdFromCustomer(supabase, customerId);
            await supabase
              .from("subscriptions")
              .update({ status: "past_due" })
              .eq("stripe_subscription_id", subId);
          }
        }
        break;
      }
    }
  } catch (error) {
    // 200을 반환하여 Stripe 재시도를 방지하고, 에러는 로그로만 기록
    console.error("Webhook handler error:", error);
    return NextResponse.json({ received: true, error: "handler_failed" });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChange(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    const resolvedId = await getUserIdFromCustomer(
      supabase,
      subscription.customer as string,
    );
    if (!resolvedId) return;
    return handleSubscriptionChangeForUser(supabase, subscription, resolvedId);
  }
  return handleSubscriptionChangeForUser(supabase, subscription, userId);
}

async function handleSubscriptionChangeForUser(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
  userId: string,
) {
  const planName = subscription.metadata?.plan_name || "free";
  const priceId = subscription.items.data[0]?.price?.id;

  // 플랜 조회
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", planName)
    .single();

  if (!plan) return;

  const status = mapStripeStatus(subscription.status);

  // 기간 정보 (Stripe v20: items.data[0]에서 조회)
  const firstItem = subscription.items.data[0];
  const periodStart = firstItem?.current_period_start ?? subscription.start_date;
  const periodEnd = firstItem?.current_period_end ?? subscription.start_date;

  // 기존 구독 확인
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  const subscriptionData = {
    user_id: userId,
    plan_id: plan.id,
    status,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId || null,
    current_period_start: new Date(periodStart * 1000).toISOString(),
    current_period_end: new Date(periodEnd * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  };

  if (existing) {
    await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("id", existing.id);
  } else {
    await supabase.from("subscriptions").insert(subscriptionData);
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
) {
  // 무료 플랜으로 다운그레이드
  const userId =
    subscription.metadata?.supabase_user_id ||
    (await getUserIdFromCustomer(
      supabase,
      subscription.customer as string,
    ));

  if (!userId) return;

  const { data: freePlan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "free")
    .single();

  if (!freePlan) return;

  await supabase
    .from("subscriptions")
    .update({
      plan_id: freePlan.id,
      status: "canceled",
      stripe_subscription_id: null,
      stripe_price_id: null,
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", subscription.id);
}

async function getUserIdFromCustomer(
  supabase: ReturnType<typeof createAdminClient>,
  stripeCustomerId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();
  return data?.id || null;
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): "active" | "canceled" | "past_due" | "trialing" {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      return "canceled";
  }
}
