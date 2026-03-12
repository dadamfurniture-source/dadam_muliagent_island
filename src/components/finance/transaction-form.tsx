"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/lib/actions/finance";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/constants/finance";

interface Project {
  id: string;
  title: string;
}

interface TransactionFormProps {
  projects: Project[];
}

const PAYMENT_METHODS = ["현금", "카드", "계좌이체", "기타"];

export function TransactionForm({ projects }: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("type", type);

    startTransition(async () => {
      try {
        await createTransaction(formData);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "거래 등록에 실패했습니다.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="sm">거래 등록</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>거래 등록</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {/* 매출/매입 토글 */}
          <div className="flex rounded-lg border p-1">
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                type === "income"
                  ? "bg-blue-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              매출
            </button>
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                type === "expense"
                  ? "bg-red-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              매입
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">금액 (원) *</Label>
              <Input
                name="amount"
                type="number"
                min="1"
                required
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="transaction_date">날짜 *</Label>
              <Input
                name="transaction_date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>

            <div>
              <Label htmlFor="project_id">프로젝트 (선택)</Label>
              <Select name="project_id">
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 연결 (선택)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_method">결제 수단</Label>
              <Select name="payment_method">
                <SelectTrigger>
                  <SelectValue placeholder="결제 수단 (선택)" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">메모</Label>
              <Textarea
                name="description"
                placeholder="거래 내용을 입력하세요"
                rows={2}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "등록 중..." : `${type === "income" ? "매출" : "매입"} 등록`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
