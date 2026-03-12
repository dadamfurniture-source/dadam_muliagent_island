import { ProjectForm } from "@/components/projects/project-form";
import { getCustomers } from "@/lib/actions/customers";

export default async function NewProjectPage() {
  let customers: Array<{ id: string; name: string }> = [];
  try {
    customers = await getCustomers();
  } catch {
    // Supabase 미설정 시 빈 배열
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">새 프로젝트</h1>
      <ProjectForm customers={customers} />
    </div>
  );
}
