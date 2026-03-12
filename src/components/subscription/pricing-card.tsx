"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PricingCardProps {
  plan: {
    name: string;
    display_name: string;
    price_monthly: number;
    price_yearly: number;
    ai_image_limit: number;
    agent_chat_limit: number;
    drawing_enabled: boolean;
    drawing_image_gen: boolean;
    features: Record<string, boolean>;
  };
  currentPlan: string;
  interval: "monthly" | "yearly";
}

export function PricingCard({ plan, currentPlan, interval }: PricingCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const price = interval === "yearly" ? plan.price_yearly : plan.price_monthly;
  const monthlyEquivalent =
    interval === "yearly" ? Math.round(plan.price_yearly / 12) : plan.price_monthly;
  const isCurrentPlan = currentPlan === plan.name;
  const isFree = plan.name === "free";
  const isPopular = plan.name === "pro";

  function handleSubscribe() {
    if (isFree || isCurrentPlan) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: plan.name, interval }),
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error || "결제 페이지 생성에 실패했습니다.");
        }
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      }
    });
  }

  return (
    <Card
      className={`relative ${isPopular ? "border-blue-500 border-2" : ""} ${isCurrentPlan ? "bg-blue-50/50" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-500">인기</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">{plan.display_name}</CardTitle>
        <div className="mt-2">
          {isFree ? (
            <div className="text-3xl font-bold">무료</div>
          ) : (
            <>
              <div className="text-3xl font-bold">
                ₩{monthlyEquivalent.toLocaleString("ko-KR")}
                <span className="text-sm font-normal text-gray-500">/월</span>
              </div>
              {interval === "yearly" && (
                <div className="mt-1 text-xs text-green-600">
                  연 ₩{price.toLocaleString("ko-KR")} (20% 할인)
                </div>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2 text-sm mb-6">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            이미지 생성 {plan.ai_image_limit}회/월
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            AI 상담 {plan.agent_chat_limit === -1 ? "무제한" : `${plan.agent_chat_limit}회/월`}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            자동 견적 산출
          </li>
          {plan.drawing_enabled && (
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              도면 기능
            </li>
          )}
          {plan.drawing_image_gen && (
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              도면→이미지 생성
            </li>
          )}
        </ul>

        {error && (
          <p className="mb-3 text-xs text-red-500 text-center">{error}</p>
        )}

        <Button
          onClick={handleSubscribe}
          disabled={isFree || isCurrentPlan || isPending}
          variant={isPopular ? "default" : "outline"}
          className="w-full"
        >
          {isCurrentPlan
            ? "현재 플랜"
            : isFree
              ? "기본 플랜"
              : isPending
                ? "처리 중..."
                : "구독하기"}
        </Button>
      </CardContent>
    </Card>
  );
}
