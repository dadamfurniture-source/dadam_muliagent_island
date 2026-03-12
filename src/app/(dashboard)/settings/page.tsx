import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SETTINGS = [
  { href: "/settings/profile", title: "프로필", description: "이름, 연락처, 회사 정보를 관리합니다." },
  { href: "/settings/subscription", title: "구독 관리", description: "요금제 변경, 결제 이력을 확인합니다." },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">설정</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
