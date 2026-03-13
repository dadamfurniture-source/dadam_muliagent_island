import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <h2 className="mt-4 text-xl font-semibold">페이지를 찾을 수 없습니다</h2>
      <p className="mt-2 text-gray-500">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard">
          <Button>대시보드로 이동</Button>
        </Link>
        <Link href="/">
          <Button variant="outline">홈으로</Button>
        </Link>
      </div>
    </div>
  );
}
