import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusChart } from "@/components/dashboard/status-chart";
import {
  getDashboardStats,
  getRecentProjects,
  getUpcomingSchedules,
  getMonthlyRevenueChart,
  getProjectStatusDistribution,
} from "@/lib/actions/dashboard";
import { PROJECT_STATUS_LABELS } from "@/types";
import type { ProjectStatus } from "@/types";

function formatCurrency(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  consultation: "상담",
  measuring: "실측",
  design_review: "디자인 검토",
  manufacturing_start: "제작 시작",
  manufacturing_end: "제작 완료",
  delivery: "배송",
  installation: "설치",
  after_service: "A/S",
};

export default async function DashboardPage() {
  let stats = {
    activeProjects: 0,
    totalProjects: 0,
    upcomingSchedules: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthProfit: 0,
    monthImageCount: 0,
    month: "",
  };
  let recentProjects: Awaited<ReturnType<typeof getRecentProjects>> = [];
  let upcomingSchedules: Awaited<ReturnType<typeof getUpcomingSchedules>> = [];
  let revenueData: Awaited<ReturnType<typeof getMonthlyRevenueChart>> = [];
  let statusData: Awaited<ReturnType<typeof getProjectStatusDistribution>> = [];

  try {
    [stats, recentProjects, upcomingSchedules, revenueData, statusData] =
      await Promise.all([
        getDashboardStats(),
        getRecentProjects(),
        getUpcomingSchedules(),
        getMonthlyRevenueChart(),
        getProjectStatusDistribution(),
      ]);
  } catch {
    // 인증 안 된 경우 빈 상태
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-gray-500">주문제작 가구 AI 플랫폼</p>
      </div>

      {/* KPI 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              진행 중 프로젝트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-gray-500">전체 {stats.totalProjects}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              이번 달 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.monthIncome)}
            </div>
            <p className="text-xs text-gray-500">
              순이익{" "}
              <span className={stats.monthProfit >= 0 ? "text-green-600" : "text-red-600"}>
                {formatCurrency(stats.monthProfit)}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              이번 달 매입
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.monthExpense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              예정된 일정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingSchedules}건</div>
            <p className="text-xs text-gray-500">
              AI 이미지 {stats.monthImageCount}회 생성
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>월별 매출/매입 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 상태 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={statusData} />
          </CardContent>
        </Card>
      </div>

      {/* 최근 프로젝트 & 다가오는 일정 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 프로젝트</CardTitle>
            <Link href="/projects" className="text-sm text-blue-600 hover:underline">
              전체 보기
            </Link>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-gray-500">아직 프로젝트가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-gray-500">
                        {(p.customer as unknown as { name: string } | null)?.name || "-"}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {PROJECT_STATUS_LABELS[p.status as ProjectStatus] || p.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>다가오는 일정</CardTitle>
            <Link href="/schedule" className="text-sm text-blue-600 hover:underline">
              전체 보기
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingSchedules.length === 0 ? (
              <p className="text-sm text-gray-500">예정된 일정이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="text-xs text-gray-500">
                        {(s.project as unknown as { id: string; title: string } | null)?.title || "-"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        {new Date(s.scheduled_date).toLocaleDateString("ko-KR")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {SCHEDULE_TYPE_LABELS[s.schedule_type] || s.schedule_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
