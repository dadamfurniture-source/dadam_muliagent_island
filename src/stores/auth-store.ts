import { create } from "zustand";
import type { Profile, SubscriptionPlan } from "@/types";

interface AuthState {
  user: Profile | null;
  plan: SubscriptionPlan;
  isLoading: boolean;
  setUser: (user: Profile | null) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  plan: "free",
  isLoading: true,
  setUser: (user) => set({ user }),
  setPlan: (plan) => set({ plan }),
  setLoading: (isLoading) => set({ isLoading }),
}));
