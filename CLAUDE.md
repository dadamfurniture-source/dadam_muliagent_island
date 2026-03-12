# FurniAI - 주문제작 가구 AI 플랫폼

## 프로젝트 개요
주문제작 가구 주문/설계/시공 관리 SaaS 플랫폼.
멀티 에이전트 AI 아키텍처로 상담, 이미지 생성, 견적, 도면, 일정 관리를 통합 제공.

## 기술 스택
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand (client) + TanStack Query (server)
- **DB/Auth**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Claude API (agents) + Gemini 2.0 Flash (image generation)
- **Payment**: Stripe (global, multi-currency)
- **Drawing**: Excalidraw
- **Queue**: Inngest
- **Deploy**: Vercel
- **Package Manager**: pnpm

## 프로젝트 구조
- `src/app/` - Next.js App Router 페이지
  - `(auth)/` - 인증 (로그인, 회원가입)
  - `(dashboard)/` - 대시보드 (인증 필요)
  - `(marketing)/` - 공개 마케팅 페이지
  - `api/` - Route Handlers
- `src/components/` - React 컴포넌트
  - `ui/` - shadcn/ui 기본 컴포넌트
  - `layout/` - 레이아웃 (사이드바, 헤더)
  - `ai/`, `projects/`, `quote/`, `drawing/`, `schedule/`, `finance/` - 도메인별
- `src/lib/` - 유틸리티, 외부 서비스 연동
  - `ai/` - Claude, Gemini 클라이언트 및 프롬프트
  - `supabase/` - Supabase 클라이언트 (client, server, admin)
  - `payments/` - Stripe 연동
- `src/stores/` - Zustand 스토어
- `src/types/` - TypeScript 타입 정의
- `supabase/` - 마이그레이션, Edge Functions

## 코딩 컨벤션
- 한국어 UI, 영어 코드
- Server Components 기본, Client Components는 "use client" 명시
- Zod로 API 입력 검증
- 타입은 `src/types/index.ts`에 중앙 관리
- 환경변수: `.env.local` (gitignore), `.env.example` (템플릿)

## AI 에이전트 구조
- 오케스트레이터 (Claude): 작업 분석 및 에이전트 분배
- 상담 에이전트 (Claude): 고객 요구 파악, 가구 추천
- 이미지 에이전트 (Gemini): 현장사진 + 가구 합성
- 견적 에이전트 (Claude): 자동 견적 산출
- 도면 에이전트 (Claude): 도면 해석, 이미지 프롬프트 변환
- 일정 에이전트 (Claude): 일정 관리, 워크플로우 전이

## 워크플로우
상담 → 실측 → 설계/디자인 → 견적 → 확정 → 발주 → 제작 → 설치 → 완료 → A/S
