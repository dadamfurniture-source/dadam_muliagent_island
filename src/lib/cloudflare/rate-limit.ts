/**
 * 인메모리 레이트 리미터 (슬라이딩 윈도우)
 * Vercel 서버리스에서는 인스턴스 간 상태가 공유되지 않지만,
 * 단일 인스턴스 내에서 기본적인 보호를 제공합니다.
 * 프로덕션에서는 Cloudflare WAF Rate Limiting 또는 Upstash Redis로 교체 권장.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 5분마다 만료된 엔트리 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** 윈도우 내 최대 요청 수 */
  maxRequests: number;
  /** 윈도우 크기 (밀리초) */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // 새 윈도우 시작
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

// 프리셋 설정
export const RATE_LIMITS = {
  /** AI 채팅: 분당 10회 */
  aiChat: { maxRequests: 10, windowMs: 60 * 1000 },
  /** 이미지 생성: 시간당 20회 */
  imageGen: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  /** 인증: 분당 5회 */
  auth: { maxRequests: 5, windowMs: 60 * 1000 },
} as const;
