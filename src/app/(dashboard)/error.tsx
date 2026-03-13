"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold">오류가 발생했습니다</h2>
      <p className="mt-2 text-gray-500">
        {error.message === "Unauthorized"
          ? "로그인이 필요합니다."
          : "페이지를 불러오는 중 문제가 발생했습니다."}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>다시 시도</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/login")}>
          로그인
        </Button>
      </div>
    </div>
  );
}
