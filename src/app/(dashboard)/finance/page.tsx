import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from "@/components/finance/transaction-form";
import { TransactionList } from "@/components/finance/transaction-list";
import { MonthFilter } from "@/components/finance/month-filter";
import { getTransactions, getMonthlySummary } from "@/lib/actions/finance";
import { getProjects } from "@/lib/actions/projects";

function formatCurrency(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  const params = await searchParams;
  const month = params.month || new Date().toISOString().slice(0, 7);
  const typeFilter = params.type as "income" | "expense" | undefined;

  let transactions: Awaited<ReturnType<typeof getTransactions>> = [];
  let summary = { month, income: 0, expense: 0, profit: 0 };
  let projects: { id: string; title: string }[] = [];

  try {
    [transactions, summary, projects] = await Promise.all([
      getTransactions({ month, type: typeFilter }),
      getMonthlySummary(month),
      getProjects().then((p) => p.map((x) => ({ id: x.id, title: x.title }))),
    ]);
  } catch {
    // 인증 안 된 경우 빈 상태
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">매출/매입</h1>
        <TransactionForm projects={projects} />
      </div>

      {/* 월 필터 */}
      <Suspense>
        <MonthFilter />
      </Suspense>

      {/* 요약 카드 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">매입</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.expense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">순이익</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.profit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(summary.profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 거래 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionList transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
