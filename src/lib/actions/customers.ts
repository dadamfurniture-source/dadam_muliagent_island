"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/actions/auth-guard";

export async function getCustomers(search?: string) {
  const { supabase } = await requireAuth();
  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getCustomer(id: string) {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCustomer(formData: FormData) {
  const { supabase, user } = await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("이름은 필수입니다.");

  const { error } = await supabase.from("customers").insert({
    owner_id: user.id,
    name,
    phone: (formData.get("phone") as string)?.trim() || null,
    address: (formData.get("address") as string)?.trim() || null,
    address_detail: (formData.get("address_detail") as string)?.trim() || null,
    notes: (formData.get("notes") as string)?.trim() || null,
  });

  if (error) throw error;
  revalidatePath("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  const { supabase } = await requireAuth();

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("이름은 필수입니다.");

  const { error } = await supabase
    .from("customers")
    .update({
      name,
      phone: (formData.get("phone") as string)?.trim() || null,
      address: (formData.get("address") as string)?.trim() || null,
      address_detail: (formData.get("address_detail") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const { supabase } = await requireAuth();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/customers");
}
