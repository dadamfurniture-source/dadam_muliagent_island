"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { saveDrawing } from "@/lib/actions/drawings";

// Excalidraw는 SSR 불가 - dynamic import
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-gray-500">도면 에디터 로딩 중...</div> },
);

interface ExcalidrawAPI {
  getSceneElements: () => Record<string, unknown>[];
  getAppState: () => Record<string, unknown>;
  getFiles: () => Record<string, unknown>;
}

interface DrawingEditorProps {
  drawingId: string;
  initialData: {
    elements: readonly Record<string, unknown>[];
    appState: Record<string, unknown>;
    files: Record<string, unknown>;
  };
  title: string;
  onExportImage?: (dataUrl: string) => void;
}

export function DrawingEditor({
  drawingId,
  initialData,
  title,
  onExportImage,
}: DrawingEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawAPI | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 자동 저장 (2초 디바운스)
  const handleChange = useCallback(
    (elements: readonly Record<string, unknown>[], appState: Record<string, unknown>, files: Record<string, unknown>) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await saveDrawing(drawingId, {
            elements: elements as unknown as Record<string, unknown>,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              gridSize: appState.gridSize,
            },
            files,
          });
          setLastSaved(new Date().toLocaleTimeString("ko-KR"));
        } catch {
          // 저장 실패 무시 (다음 변경 시 재시도)
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [drawingId],
  );

  // PNG 내보내기
  async function handleExportPNG() {
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const api = excalidrawAPIRef.current;

      if (!api) return;

      const blob = await exportToBlob({
        elements: api.getSceneElements(),
        appState: { ...api.getAppState(), exportWithDarkMode: false },
        files: api.getFiles(),
        mimeType: "image/png",
        quality: 0.95,
      });

      if (onExportImage) {
        // 도면→이미지 생성용
        const reader = new FileReader();
        reader.onload = () => {
          onExportImage(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } else {
        // 다운로드
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "drawing"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      alert("이미지 내보내기에 실패했습니다.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 상단 툴바 */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-sm">{title}</h3>
          <span className="text-xs text-gray-400">
            {isSaving ? "저장 중..." : lastSaved ? `${lastSaved} 저장됨` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPNG}>
            PNG 내보내기
          </Button>
          {onExportImage && (
            <Button size="sm" onClick={handleExportPNG}>
              AI 이미지 생성
            </Button>
          )}
        </div>
      </div>

      {/* Excalidraw 에디터 */}
      <div className="flex-1">
        <Excalidraw
          excalidrawAPI={(api: unknown) => {
            excalidrawAPIRef.current = api as ExcalidrawAPI;
          }}
          initialData={{
            elements: initialData.elements as never,
            appState: {
              ...initialData.appState,
              collaborators: new Map(),
            } as never,
            files: initialData.files as never,
          }}
          onChange={handleChange as never}
          langCode="ko-KR"
          theme="light"
        />
      </div>
    </div>
  );
}
