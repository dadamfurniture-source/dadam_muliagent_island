import { ChatPanel } from "@/components/ai/chat-panel";

export default function AIStudioPage() {
  return (
    <div className="-m-4 md:-m-6 flex h-[calc(100vh-4rem)]">
      {/* 메인 채팅 */}
      <div className="flex-1">
        <ChatPanel />
      </div>

      {/* 우측 사이드 패널 (향후 이미지 갤러리, 견적 미리보기 등) */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-l lg:bg-gray-50/50">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold text-sm">상담 정보</h3>
        </div>
        <div className="flex-1 p-4 text-sm text-gray-500">
          <p>AI 상담을 시작하면 여기에 수집된 정보가 표시됩니다.</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs font-medium text-gray-400 mb-1">가구 유형</div>
              <div className="text-gray-600">-</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs font-medium text-gray-400 mb-1">스타일</div>
              <div className="text-gray-600">-</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs font-medium text-gray-400 mb-1">자재</div>
              <div className="text-gray-600">-</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-xs font-medium text-gray-400 mb-1">예상 견적</div>
              <div className="text-gray-600">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
