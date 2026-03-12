"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCustomer } from "@/lib/actions/customers";

export function CustomerActions({ customerId }: { customerId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("이 고객을 삭제하시겠습니까?")) return;
    try {
      await deleteCustomer(customerId);
    } catch {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="cursor-pointer px-2 text-gray-400 hover:text-gray-600">
          ⋮
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/customers/${customerId}`)}>
          상세보기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
