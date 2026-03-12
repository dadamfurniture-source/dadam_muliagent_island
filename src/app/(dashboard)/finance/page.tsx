import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">매출/매입</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">이번 달 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">이번 달 매입</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">순이익</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩0</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          매출/매입 기능은 Phase 8에서 구현됩니다.
        </CardContent>
      </Card>
    </div>
  );
}
