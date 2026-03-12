"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AgentMessage } from "@/lib/ai/agents/types";
import { AGENT_ROLE_LABELS } from "@/lib/ai/agents/types";
import Image from "next/image";

interface ChatMessageProps {
  message: AgentMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm">
          AI
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-900",
        )}
      >
        {!isUser && message.agentRole && (
          <Badge variant="outline" className="mb-2 text-xs">
            {AGENT_ROLE_LABELS[message.agentRole] || message.agentRole}
          </Badge>
        )}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
        {message.imageUrl && (
          <div className="mt-3 relative w-full aspect-video">
            <Image
              src={message.imageUrl}
              alt="생성된 이미지"
              fill
              className="rounded-lg object-contain"
            />
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm text-white">
          나
        </div>
      )}
    </div>
  );
}
