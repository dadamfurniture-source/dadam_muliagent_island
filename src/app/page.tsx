import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    title: "AI 이미지 합성",
    description: "현장사진에 원하는 가구를 AI가 사실적으로 합성합니다.",
  },
  {
    title: "자동 견적",
    description: "품목, 사이즈, 자재를 선택하면 AI가 합리적인 견적을 산출합니다.",
  },
  {
    title: "프로젝트 관리",
    description: "상담부터 설치, A/S까지 전체 워크플로우를 한 곳에서 관리합니다.",
  },
  {
    title: "간편 도면",
    description: "드래그앤드롭으로 간단한 도면을 작성하고, AI 이미지로 변환합니다.",
  },
  {
    title: "일정 관리",
    description: "실측, 제작, 설치 일정을 캘린더로 한눈에 관리합니다.",
  },
  {
    title: "매출/매입",
    description: "프로젝트별 수입과 지출을 기록하고 재무 현황을 파악합니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="text-2xl font-bold">
          FurniAI
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
            요금제
          </Link>
          <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">
            기능
          </Link>
          <Link href="/login">
            <Button variant="outline" size="sm">
              로그인
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">시작하기</Button>
          </Link>
        </nav>
      </header>

      {/* 히어로 */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          주문제작 가구,
          <br />
          <span className="text-blue-600">AI로 미리 보세요</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-600">
          현장사진을 올리면 AI가 맞춤 가구를 합성합니다.
          견적, 일정, 도면까지 하나의 플랫폼에서 관리하세요.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/signup">
            <Button size="lg">무료로 시작하기</Button>
          </Link>
          <Link href="/features">
            <Button variant="outline" size="lg">
              기능 둘러보기
            </Button>
          </Link>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="border-t bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">주요 기능</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-lg border bg-white p-6">
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t px-6 py-8 text-center text-sm text-gray-500">
        &copy; 2026 FurniAI. All rights reserved.
      </footer>
    </div>
  );
}
