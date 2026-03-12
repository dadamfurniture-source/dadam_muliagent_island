import { ChatPanel } from "@/components/ai/chat-panel";
import { ImageGallery } from "@/components/ai/image-gallery";
import { getAIImages, getImageUsageThisMonth } from "@/lib/actions/ai-images";

export default async function AIStudioPage() {
  let images = [];
  let usageCount = 0;
  const usageLimit = 3; // 기본 무료 플랜

  try {
    [images, usageCount] = await Promise.all([
      getAIImages({ limit: 20 }),
      getImageUsageThisMonth(),
    ]);
  } catch {
    // 인증 안 된 경우 빈 상태로 표시
  }

  return (
    <div className="-m-4 md:-m-6 flex h-[calc(100vh-4rem)]">
      {/* 메인 채팅 */}
      <div className="flex-1">
        <ChatPanel />
      </div>

      {/* 우측 이미지 갤러리 패널 */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-l lg:bg-gray-50/50">
        <ImageGallery
          images={images}
          usageCount={usageCount}
          usageLimit={usageLimit}
        />
      </div>
    </div>
  );
}
