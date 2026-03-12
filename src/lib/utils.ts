import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Supabase ilike 검색에서 SQL 와일드카드 특수문자를 이스케이프합니다.
 * %, _, \ 문자를 이스케이프하여 리터럴로 검색합니다.
 */
export function escapeIlike(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
