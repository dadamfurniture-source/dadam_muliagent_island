"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueChartProps {
  data: { name: string; income: number; expense: number }[];
}

function formatAmount(value: number) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}천만`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`;
  return value.toLocaleString("ko-KR");
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
        거래 내역이 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={formatAmount} />
        <Tooltip
          formatter={(value, name) => [
            `₩${Number(value).toLocaleString("ko-KR")}`,
            name === "income" ? "매출" : "매입",
          ]}
        />
        <Legend formatter={(value) => (value === "income" ? "매출" : "매입")} />
        <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
