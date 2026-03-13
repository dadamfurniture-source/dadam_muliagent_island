import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FurniAI - 주문제작 가구 AI 플랫폼",
  description:
    "현장사진에 맞춤 가구를 AI로 합성하고, 자동 견적과 프로젝트 관리까지. 주문제작 가구의 모든 것.",
  openGraph: {
    title: "FurniAI - 주문제작 가구 AI 플랫폼",
    description:
      "현장사진을 올리면 AI가 맞춤 가구를 합성합니다. 견적, 일정, 도면까지 하나의 플랫폼에서.",
    type: "website",
    locale: "ko_KR",
  },
};

const FEATURES = [
  {
    icon: "🖼️",
    title: "AI 이미지 합성",
    description:
      "현장사진에 원하는 가구를 AI가 사실적으로 합성합니다. 고객에게 완성 모습을 미리 보여주세요.",
  },
  {
    icon: "📄",
    title: "자동 견적",
    description:
      "품목, 사이즈, 자재를 선택하면 AI가 시장가 기반 합리적인 견적을 산출합니다.",
  },
  {
    icon: "📋",
    title: "프로젝트 관리",
    description:
      "상담부터 설치, A/S까지 10단계 워크플로우를 한 곳에서 관리합니다.",
  },
  {
    icon: "✏️",
    title: "간편 도면",
    description:
      "드래그앤드롭으로 간단한 도면을 작성하고, AI로 3D 이미지로 변환합니다.",
  },
  {
    icon: "📅",
    title: "일정 관리",
    description:
      "실측, 제작, 설치 일정을 캘린더로 관리하고 AI가 다음 작업을 제안합니다.",
  },
  {
    icon: "💰",
    title: "매출/매입",
    description:
      "프로젝트별 수입과 지출을 기록하고 월별 재무 현황을 한눈에 파악합니다.",
  },
];

const PLANS = [
  {
    name: "무료",
    price: "₩0",
    features: ["AI 이미지 3회/월", "프로젝트 관리", "고객 관리", "일정 관리"],
  },
  {
    name: "기본",
    price: "₩12,900",
    period: "/월",
    features: ["AI 이미지 10회/월", "자동 견적 산출", "PDF 견적서", "매출/매입 관리"],
  },
  {
    name: "프로",
    price: "₩39,900",
    period: "/월",
    popular: true,
    features: [
      "AI 이미지 30회/월",
      "도면 에디터",
      "에이전트 대화 무제한",
      "우선 지원",
    ],
  },
  {
    name: "프로+",
    price: "₩79,900",
    period: "/월",
    features: [
      "AI 이미지 100회/월",
      "도면 → 3D 이미지 변환",
      "전용 에이전트",
      "API 접근",
    ],
  },
];

const WORKFLOW_STEPS = [
  { step: "1", title: "사진 업로드", desc: "현장사진을 올리세요" },
  { step: "2", title: "AI 합성", desc: "AI가 가구를 합성합니다" },
  { step: "3", title: "견적 확인", desc: "자동 견적을 받으세요" },
  { step: "4", title: "프로젝트 관리", desc: "완료까지 함께합니다" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-white/95 backdrop-blur px-6 py-4">
        <Link href="/" className="text-2xl font-bold">
          FurniAI
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="#features"
            className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline"
          >
            기능
          </Link>
          <Link
            href="#pricing"
            className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline"
          >
            요금제
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
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center lg:py-32">
        <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm text-gray-600">
          멀티 에이전트 AI 기반 가구 플랫폼
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          주문제작 가구,
          <br />
          <span className="text-blue-600">AI로 미리 보세요</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-gray-600">
          현장사진을 올리면 AI가 맞춤 가구를 합성합니다.
          <br />
          견적, 일정, 도면까지 하나의 플랫폼에서 관리하세요.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/signup">
            <Button size="lg" className="px-8">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* 워크플로우 */}
      <section className="border-t bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold">간단한 4단계</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW_STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">주요 기능</h2>
          <p className="mt-3 text-center text-gray-500">
            주문제작 가구 비즈니스에 필요한 모든 것
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-white p-6 transition-shadow hover:shadow-md"
              >
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 요금제 */}
      <section id="pricing" className="border-t bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">요금제</h2>
          <p className="mt-3 text-center text-gray-500">
            비즈니스 규모에 맞는 플랜을 선택하세요
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border bg-white p-6 ${
                  plan.popular ? "border-blue-500 ring-2 ring-blue-500" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                    인기
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  )}
                </div>
                <ul className="mt-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-green-500">&#10003;</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-6 block">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    시작하기
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">
          지금 바로 시작하세요
        </h2>
        <p className="mt-3 text-gray-500">
          무료 플랜으로 AI 이미지 합성을 체험해보세요. 신용카드 없이 시작할 수 있습니다.
        </p>
        <Link href="/signup" className="mt-8 inline-block">
          <Button size="lg" className="px-10">
            무료로 시작하기
          </Button>
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-gray-500">
            &copy; 2026 FurniAI. All rights reserved.
          </span>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-900">
              로그인
            </Link>
            <Link href="/signup" className="hover:text-gray-900">
              회원가입
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
