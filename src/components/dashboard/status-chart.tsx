"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface StatusChartProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981",
  "#ef4444", "#06b6d4", "#f97316", "#ec4899",
  "#6366f1", "#14b8a6",
];

export function StatusChart({ data }: StatusChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
        프로젝트가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${name} (${value})`}
          fontSize={12}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}건`]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
