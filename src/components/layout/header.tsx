"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/ai-studio", label: "AI 스튜디오" },
  { href: "/projects", label: "프로젝트" },
  { href: "/customers", label: "고객" },
  { href: "/schedule", label: "일정" },
  { href: "/finance", label: "매출/매입" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      {/* 모바일 메뉴 */}
      <Sheet>
        <SheetTrigger>
          <span className="inline-flex items-center justify-center rounded-md p-2 text-xl md:hidden hover:bg-gray-100">
            ☰
          </span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <div className="mb-6 text-xl font-bold">FurniAI</div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname.startsWith(item.href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="md:hidden text-lg font-bold">FurniAI</div>

      {/* 우측 메뉴 */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full cursor-pointer">
              <Avatar className="h-9 w-9">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href="/settings/profile" className="w-full">프로필</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings/subscription" className="w-full">구독 관리</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
