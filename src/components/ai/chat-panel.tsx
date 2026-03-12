"use client";

import { useRef, useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENT_ROLE_LABELS } from "@/lib/ai/agents/types";
import type { AgentMessage } from "@/lib/ai/agents/types";

export function ChatPanel() {
  const {
    messages,
    isLoading,
    activeAgent,
    addMessage,
    setLoading,
    setActiveAgent,
    clearMessages,
  } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(content: string) {
    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    addMessage(userMessage);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages.concat(userMessage),
        }),
      });

      const data = await res.json();

      if (data.success && data.response) {
        const assistantMessage: AgentMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response.message,
          agentRole: data.response.agentRole,
          imageUrl: data.response.imageUrl,
          metadata: data.response.metadata,
          createdAt: new Date().toISOString(),
        };

        addMessage(assistantMessage);
        setActiveAgent(data.response.agentRole);
      } else {
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.error || "오류가 발생했습니다. 다시 시도해주세요.",
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 상단 바 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">AI 상담</h2>
          {activeAgent && (
            <Badge variant="secondary">
              {AGENT_ROLE_LABELS[activeAgent]}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={clearMessages}>
          새 대화
        </Button>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
            <div className="text-4xl mb-4">🛋️</div>
            <h3 className="text-lg font-medium">FurniAI 상담을 시작하세요</h3>
            <p className="mt-2 max-w-sm text-sm">
              주문제작 가구에 대해 물어보세요. AI가 상담, 이미지 생성, 견적, 일정까지 도와드립니다.
            </p>
            <div className="mt-6 grid gap-2 text-sm">
              <button
                onClick={() => handleSend("주방 싱크대를 교체하고 싶어요")}
                className="rounded-lg border px-4 py-2 text-left hover:bg-gray-50"
              >
                &quot;주방 싱크대를 교체하고 싶어요&quot;
              </button>
              <button
                onClick={() => handleSend("붙박이장 견적이 궁금해요")}
                className="rounded-lg border px-4 py-2 text-left hover:bg-gray-50"
              >
                &quot;붙박이장 견적이 궁금해요&quot;
              </button>
              <button
                onClick={() => handleSend("실측 방문 예약하고 싶어요")}
                className="rounded-lg border px-4 py-2 text-left hover:bg-gray-50"
              >
                &quot;실측 방문 예약하고 싶어요&quot;
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
            </div>
            AI가 응답을 준비하고 있습니다
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
