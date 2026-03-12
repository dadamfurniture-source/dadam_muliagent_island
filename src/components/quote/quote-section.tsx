"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateQuoteFromProject, finalizeQuote, deleteQuote } from "@/lib/actions/quotes";

interface QuoteItem {
  name: string;
  specification: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Quote {
  id: string;
  version: number;
  items: QuoteItem[];
  material_cost: number;
  labor_cost: number;
  delivery_cost: number;
  misc_cost: number;
  discount: number;
  tax: number;
  total: number;
  notes: string | null;
  is_final: boolean;
  created_at: string;
}

interface QuoteSectionProps {
  projectId: string;
  quotes: Quote[];
  hasItems: boolean;
}

function formatCurrency(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export function QuoteSection({ projectId, quotes: initialQuotes, hasItems }: QuoteSectionProps) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialQuotes[0]?.id ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateQuoteFromProject(projectId);
        // 새로고침하여 최신 목록 반영
        window.location.reload();
        setExpandedId(result.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "견적 생성에 실패했습니다.");
      }
    });
  }

  function handleFinalize(id: string) {
    if (!confirm("이 견적을 확정하시겠습니까? 확정 후에는 삭제할 수 없습니다.")) return;
    startTransition(async () => {
      try {
        await finalizeQuote(id);
        setQuotes((prev) =>
          prev.map((q) => (q.id === id ? { ...q, is_final: true } : q)),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "견적 확정에 실패했습니다.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("이 견적을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      try {
        await deleteQuote(id);
        setQuotes((prev) => prev.filter((q) => q.id !== id));
        if (expandedId === id) setExpandedId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "견적 삭제에 실패했습니다.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>견적서</CardTitle>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={isPending || !hasItems}
        >
          {isPending ? "생성 중..." : "견적 생성"}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {quotes.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            {hasItems
              ? "견적서가 없습니다. '견적 생성' 버튼을 눌러 자동 견적을 생성하세요."
              : "품목을 먼저 추가한 후 견적을 생성할 수 있습니다."}
          </p>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="rounded-lg border">
                {/* 견적 헤더 */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === quote.id ? null : quote.id)
                  }
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">v{quote.version}</span>
                    <Badge variant={quote.is_final ? "default" : "secondary"}>
                      {quote.is_final ? "확정" : "초안"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(quote.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(quote.total)}
                  </span>
                </button>

                {/* 견적 상세 (확장) */}
                {expandedId === quote.id && (
                  <div className="border-t px-4 py-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>품목</TableHead>
                          <TableHead>규격</TableHead>
                          <TableHead>수량</TableHead>
                          <TableHead className="text-right">단가</TableHead>
                          <TableHead className="text-right">금액</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(quote.items as QuoteItem[]).map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {item.specification}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* 합계 */}
                    <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">자재비</span>
                        <span>{formatCurrency(quote.material_cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">공임</span>
                        <span>{formatCurrency(quote.labor_cost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">배송비</span>
                        <span>{formatCurrency(quote.delivery_cost)}</span>
                      </div>
                      {quote.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>할인</span>
                          <span>-{formatCurrency(quote.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">부가세</span>
                        <span>{formatCurrency(quote.tax)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-semibold">
                        <span>합계</span>
                        <span>{formatCurrency(quote.total)}</span>
                      </div>
                    </div>

                    {/* 비고 */}
                    {quote.notes && (
                      <p className="mt-3 text-xs text-gray-500">{quote.notes}</p>
                    )}

                    {/* 액션 버튼 */}
                    <div className="mt-4 flex gap-2">
                      <a
                        href={`/api/quotes/${quote.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          PDF 다운로드
                        </Button>
                      </a>
                      {!quote.is_final && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFinalize(quote.id)}
                            disabled={isPending}
                          >
                            확정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(quote.id)}
                            disabled={isPending}
                            className="text-red-500 hover:text-red-600"
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
