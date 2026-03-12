import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATS = [
  { label: "진행 중 프로젝트", value: "0", change: "" },
  { label: "이번 달 매출", value: "₩0", change: "" },
  { label: "예정된 일정", value: "0건", change: "" },
  { label: "AI 이미지 생성", value: "0/3", change: "무료 등급" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-gray-500">주문제작 가구 AI 플랫폼에 오신 것을 환영합니다.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className="text-xs text-gray-500">{stat.change}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>최근 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">아직 프로젝트가 없습니다.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>다가오는 일정</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">예정된 일정이 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
