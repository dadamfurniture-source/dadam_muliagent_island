"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ManageSubscription() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleManage() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/payments/billing", {
          method: "POST",
        });

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error || "결제 관리 페이지를 열 수 없습니다.");
        }
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      }
    });
  }

  return (
    <div>
      <Button
        variant="outline"
        onClick={handleManage}
        disabled={isPending}
      >
        {isPending ? "로딩..." : "결제 관리 (카드 변경, 구독 취소)"}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
