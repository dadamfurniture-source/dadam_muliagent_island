"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/types";

export async function getProjects(filters?: {
  status?: ProjectStatus;
  search?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("*, customer:customers(id, name, phone)")
    .order("updated_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,address.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, customer:customers(id, name, phone, address)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectItems(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const customerId = formData.get("customer_id") as string;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      customer_id: customerId || null,
      title: formData.get("title") as string,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/projects");
  return data;
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      title: formData.get("title") as string,
      customer_id: (formData.get("customer_id") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/projects");
}

export async function addOrderItem(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("order_items").insert({
    project_id: projectId,
    furniture_type: formData.get("furniture_type") as string,
    furniture_type_label: (formData.get("furniture_type_label") as string) || null,
    width_mm: Number(formData.get("width_mm")) || null,
    height_mm: Number(formData.get("height_mm")) || null,
    depth_mm: Number(formData.get("depth_mm")) || null,
    material: (formData.get("material") as string) || null,
    color: (formData.get("color") as string) || null,
    quantity: Number(formData.get("quantity")) || 1,
    unit_price: Number(formData.get("unit_price")) || 0,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteOrderItem(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("order_items").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}
