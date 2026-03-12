"use client";

import { useState } from "react";
import { PricingCard } from "./pricing-card";

interface Plan {
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  ai_image_limit: number;
  agent_chat_limit: number;
  drawing_enabled: boolean;
  drawing_image_gen: boolean;
  features: Record<string, boolean>;
}

interface PricingGridProps {
  plans: Plan[];
  currentPlan: string;
}

export function PricingGrid({ plans, currentPlan }: PricingGridProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  return (
    <div>
      {/* 월간/연간 토글 */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-lg border p-1 bg-gray-100">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              interval === "monthly"
                ? "bg-white shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            월간 결제
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              interval === "yearly"
                ? "bg-white shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            연간 결제
            <span className="ml-1 text-xs text-green-600">20% 할인</span>
          </button>
        </div>
      </div>

      {/* 플랜 카드 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            currentPlan={currentPlan}
            interval={interval}
          />
        ))}
      </div>
    </div>
  );
}
