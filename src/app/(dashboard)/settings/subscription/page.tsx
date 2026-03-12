import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingGrid } from "@/components/subscription/pricing-grid";
import { ManageSubscription } from "@/components/subscription/manage-subscription";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  getMonthlyUsage,
} from "@/lib/actions/subscriptions";

export default async function SubscriptionPage() {
  let plans: Awaited<ReturnType<typeof getSubscriptionPlans>> = [];
  let subscription: Awaited<ReturnType<typeof getCurrentSubscription>> = null;
  let usage = { image_gen: 0, chat: 0, quote_assist: 0, drawing_gen: 0 };

  try {
    [plans, subscription, usage] = await Promise.all([
      getSubscriptionPlans(),
      getCurrentSubscription(),
      getMonthlyUsage(),
    ]);
  } catch {
    // 인증 안 된 경우 빈 상태
  }

  const currentPlan = (subscription?.plan as { name: string } | null)?.name || "free";
  const planDisplayName = (subscription?.plan as { display_name: string } | null)?.display_name || "무료";
  const imageLimit = (subscription?.plan as { ai_image_limit: number } | null)?.ai_image_limit ?? 3;
  const chatLimit = (subscription?.plan as { agent_chat_limit: number } | null)?.agent_chat_limit ?? 20;

  const statusLabels: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { text: "활성", variant: "default" },
    trialing: { text: "체험중", variant: "secondary" },
    past_due: { text: "결제 필요", variant: "destructive" },
    canceled: { text: "취소됨", variant: "outline" },
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">구독 관리</h1>

      {/* 현재 구독 상태 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">현재 플랜</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{planDisplayName}</span>
              {subscription?.status && (
                <Badge variant={statusLabels[subscription.status]?.variant || "outline"}>
                  {statusLabels[subscription.status]?.text || subscription.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">이미지 생성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {usage.image_gen}/{imageLimit}회
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${Math.min((usage.image_gen / imageLimit) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">AI 상담</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {usage.chat}/{chatLimit === -1 ? "∞" : chatLimit}회
            </div>
            {chatLimit > 0 && (
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${Math.min((usage.chat / chatLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">갱신일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {subscription?.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString("ko-KR")
                : "-"}
            </div>
            {subscription?.cancel_at_period_end && (
              <p className="mt-1 text-xs text-red-500">
                기간 만료 시 구독이 취소됩니다
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 결제 관리 버튼 */}
      {currentPlan !== "free" && <ManageSubscription />}

      {/* 플랜 비교 & 업그레이드 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">요금제</h2>
        <PricingGrid plans={plans} currentPlan={currentPlan} />
      </div>
    </div>
  );
}
