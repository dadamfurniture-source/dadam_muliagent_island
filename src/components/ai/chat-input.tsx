"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex gap-2 border-t bg-white p-4">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="가구에 대해 물어보세요... (예: 주방 싱크대를 교체하고 싶어요)"
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
        disabled={disabled}
      />
      <Button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className="shrink-0 self-end"
      >
        {disabled ? "처리 중..." : "전송"}
      </Button>
    </div>
  );
}
