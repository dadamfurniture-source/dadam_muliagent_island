"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AIImage } from "@/types";

interface ImageGalleryProps {
  images: AIImage[];
  usageCount: number;
  usageLimit: number;
}

export function ImageGallery({ images: initialImages, usageCount, usageLimit }: ImageGalleryProps) {
  const [images, setImages] = useState(initialImages);
  const [selectedImage, setSelectedImage] = useState<AIImage | null>(null);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const statusLabels: Record<string, { text: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { text: "대기 중", variant: "secondary" },
    processing: { text: "생성 중", variant: "default" },
    completed: { text: "완료", variant: "outline" },
    failed: { text: "실패", variant: "destructive" },
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold text-sm">이미지 갤러리</h3>
        <div className="mt-1 text-xs text-gray-500">
          이번 달 {usageCount}/{usageLimit}회 사용
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min((usageCount / usageLimit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* 이미지 목록 */}
      <div className="flex-1 overflow-y-auto p-3">
        {images.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            <p>생성된 이미지가 없습니다.</p>
            <p className="mt-1 text-xs">
              채팅에서 현장사진을 첨부하고<br />
              가구 합성을 요청해보세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group relative aspect-square overflow-hidden rounded-lg border hover:border-blue-400 transition-colors"
              >
                {img.generated_image_url ? (
                  <Image
                    src={img.generated_image_url}
                    alt={img.furniture_type}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={img.source_image_url}
                    alt="원본"
                    fill
                    className="object-cover opacity-50"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1.5">
                  <Badge {...statusLabels[img.status]} className="text-[10px]">
                    {statusLabels[img.status]?.text || img.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 선택된 이미지 상세 */}
      {selectedImage && (
        <div className="border-t p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              {selectedImage.furniture_type}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setSelectedImage(null)}
            >
              닫기
            </Button>
          </div>
          {selectedImage.generated_image_url && (
            <div className="relative aspect-video rounded-lg overflow-hidden border">
              <Image
                src={selectedImage.generated_image_url}
                alt="생성 이미지"
                fill
                className="object-contain"
              />
            </div>
          )}
          {selectedImage.prompt && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-3">
              {selectedImage.prompt}
            </p>
          )}
          <div className="mt-1 text-[10px] text-gray-400">
            {new Date(selectedImage.created_at).toLocaleDateString("ko-KR")}
          </div>
        </div>
      )}
    </div>
  );
}
