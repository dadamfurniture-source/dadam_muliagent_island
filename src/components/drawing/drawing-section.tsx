"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createDrawing, deleteDrawing } from "@/lib/actions/drawings";

interface Drawing {
  id: string;
  project_id: string;
  title: string | null;
  thumbnail_url: string | null;
  version: number;
  updated_at: string;
}

interface DrawingSectionProps {
  projectId: string;
  drawings: Drawing[];
  canUseDrawing: boolean;
}

export function DrawingSection({ projectId, drawings: initialDrawings, canUseDrawing }: DrawingSectionProps) {
  const [drawings, setDrawings] = useState(initialDrawings);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      try {
        const result = await createDrawing(projectId);
        // 새 도면 페이지로 이동
        window.location.href = `/projects/${projectId}/drawings/${result.id}`;
      } catch {
        alert("도면 생성에 실패했습니다.");
      }
    });
  }

  function handleDelete(drawingId: string) {
    if (!confirm("이 도면을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      try {
        await deleteDrawing(drawingId, projectId);
        setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
      } catch {
        alert("도면 삭제에 실패했습니다.");
      }
    });
  }

  if (!canUseDrawing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>도면</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">
              도면 기능은 프로 플랜 이상에서 사용할 수 있습니다.
            </p>
            <Link href="/settings/subscription">
              <Button variant="outline" size="sm">
                플랜 업그레이드
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>도면</CardTitle>
        <Button size="sm" onClick={handleCreate} disabled={isPending}>
          {isPending ? "생성 중..." : "새 도면"}
        </Button>
      </CardHeader>
      <CardContent>
        {drawings.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            등록된 도면이 없습니다. &apos;새 도면&apos; 버튼을 눌러 도면을 생성하세요.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drawings.map((drawing) => (
              <div
                key={drawing.id}
                className="group relative rounded-lg border hover:border-blue-400 transition-colors"
              >
                <Link href={`/projects/${projectId}/drawings/${drawing.id}`}>
                  <div className="relative aspect-[4/3] bg-gray-50 rounded-t-lg flex items-center justify-center">
                    {drawing.thumbnail_url ? (
                      <Image
                        src={drawing.thumbnail_url}
                        alt={drawing.title || "도면"}
                        fill
                        className="object-contain rounded-t-lg"
                      />
                    ) : (
                      <span className="text-3xl text-gray-300">📐</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {drawing.title || "제목 없음"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        v{drawing.version}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {new Date(drawing.updated_at).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(drawing.id);
                  }}
                  className="absolute top-2 right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                  title="삭제"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
