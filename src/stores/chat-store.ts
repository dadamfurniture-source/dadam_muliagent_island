import { create } from "zustand";
import type { AgentMessage, AgentRole } from "@/lib/ai/agents/types";

interface ChatState {
  messages: AgentMessage[];
  isLoading: boolean;
  sessionData: Record<string, unknown>;
  activeAgent: AgentRole | null;
  addMessage: (message: AgentMessage) => void;
  setLoading: (loading: boolean) => void;
  setActiveAgent: (agent: AgentRole | null) => void;
  updateSessionData: (data: Record<string, unknown>) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  sessionData: {},
  activeAgent: null,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveAgent: (activeAgent) => set({ activeAgent }),
  updateSessionData: (data) =>
    set((state) => ({
      sessionData: { ...state.sessionData, ...data },
    })),
  clearMessages: () => set({ messages: [], sessionData: {}, activeAgent: null }),
}));
