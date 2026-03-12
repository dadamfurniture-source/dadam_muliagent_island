"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTransaction } from "@/lib/actions/finance";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  payment_method: string | null;
  project?: { id: string; title: string } | null;
}

interface TransactionListProps {
  transactions: Transaction[];
}

function formatCurrency(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export function TransactionList({ transactions: initialTransactions }: TransactionListProps) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("이 거래를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      try {
        await deleteTransaction(id);
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } catch {
        alert("거래 삭제에 실패했습니다.");
      }
    });
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        등록된 거래가 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>날짜</TableHead>
          <TableHead>유형</TableHead>
          <TableHead>카테고리</TableHead>
          <TableHead>내용</TableHead>
          <TableHead>프로젝트</TableHead>
          <TableHead>결제</TableHead>
          <TableHead className="text-right">금액</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-sm">
              {new Date(t.transaction_date).toLocaleDateString("ko-KR")}
            </TableCell>
            <TableCell>
              <Badge variant={t.type === "income" ? "default" : "destructive"}>
                {t.type === "income" ? "매출" : "매입"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{t.category}</TableCell>
            <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
              {t.description || "-"}
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              {t.project?.title || "-"}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {t.payment_method || "-"}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${
                t.type === "income" ? "text-blue-600" : "text-red-600"
              }`}
            >
              {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(t.id)}
                disabled={isPending}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                삭제
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
