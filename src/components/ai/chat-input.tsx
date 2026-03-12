"use client";

import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface AttachedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
  fileName: string;
}

interface ChatInputProps {
  onSend: (message: string, image?: AttachedImage) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmed = input.trim();
    if ((!trimmed && !attachedImage) || disabled) return;
    onSend(trimmed || "이미지를 분석해주세요.", attachedImage ?? undefined);
    setInput("");
    setAttachedImage(null);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("JPG, PNG, WebP 형식만 지원합니다.");
      return;
    }
    if (file.size > MAX_SIZE) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    const base64 = await fileToBase64(file);
    const previewUrl = URL.createObjectURL(file);

    setAttachedImage({
      base64,
      mimeType: file.type,
      previewUrl,
      fileName: file.name,
    });

    // reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
      setAttachedImage(null);
    }
  }

  return (
    <div className="border-t bg-white">
      {/* 첨부 이미지 미리보기 */}
      {attachedImage && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <Image
              src={attachedImage.previewUrl}
              alt={attachedImage.fileName}
              width={120}
              height={80}
              className="rounded-lg border object-cover"
              style={{ width: 120, height: 80 }}
            />
            <button
              onClick={removeImage}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
              title="이미지 제거"
            >
              x
            </button>
            <div className="mt-1 text-xs text-gray-500 truncate max-w-[120px]">
              {attachedImage.fileName}
            </div>
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex items-end gap-2 p-4">
        {/* 파일 첨부 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="shrink-0 self-end text-lg px-2"
          title="현장사진 첨부"
        >
          📎
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            attachedImage
              ? "이 사진에 어떤 가구를 넣고 싶으신가요?"
              : "가구에 대해 물어보세요... (📎으로 현장사진 첨부)"
          }
          className="min-h-[44px] max-h-[120px] resize-none"
          rows={1}
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={(!input.trim() && !attachedImage) || disabled}
          className="shrink-0 self-end"
        >
          {disabled ? "처리 중..." : "전송"}
        </Button>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/png;base64,XXXX -> XXXX
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
