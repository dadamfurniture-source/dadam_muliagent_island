"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/cloudflare/turnstile";
import { redirect } from "next/navigation";

export async function login(formData: {
  email: string;
  password: string;
  turnstileToken?: string;
}) {
  // Turnstile 검증
  if (formData.turnstileToken) {
    const valid = await verifyTurnstile(formData.turnstileToken);
    if (!valid) {
      return { error: "보안 검증에 실패했습니다. 다시 시도해주세요." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect("/dashboard");
}

export async function signup(formData: {
  name: string;
  email: string;
  password: string;
  turnstileToken?: string;
}) {
  // Turnstile 검증
  if (formData.turnstileToken) {
    const valid = await verifyTurnstile(formData.turnstileToken);
    if (!valid) {
      return { error: "보안 검증에 실패했습니다. 다시 시도해주세요." };
    }
  }

  if (formData.password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.name,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "이미 가입된 이메일입니다." };
    }
    return { error: "회원가입에 실패했습니다. 다시 시도해주세요." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
