"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function MonthFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const [year, month] = currentMonth.split("-").map(Number);

  function navigate(newMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    router.push(`/finance?${params.toString()}`);
  }

  function prevMonth() {
    const d = new Date(year, month - 2, 1);
    navigate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    const d = new Date(year, month, 1);
    navigate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function thisMonth() {
    navigate(new Date().toISOString().slice(0, 7));
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={prevMonth}>
        &lt;
      </Button>
      <span className="min-w-[120px] text-center font-medium">
        {year}년 {month}월
      </span>
      <Button variant="outline" size="sm" onClick={nextMonth}>
        &gt;
      </Button>
      <Button variant="ghost" size="sm" onClick={thisMonth} className="ml-2 text-xs">
        이번 달
      </Button>
    </div>
  );
}
