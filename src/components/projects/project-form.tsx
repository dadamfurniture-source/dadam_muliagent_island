"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProject, updateProject } from "@/lib/actions/projects";

interface ProjectFormProps {
  project?: {
    id: string;
    title: string;
    customer_id: string | null;
    address: string | null;
    notes: string | null;
  };
  customers?: Array<{ id: string; name: string }>;
}

export function ProjectForm({ project, customers = [] }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!project;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isEdit) {
        await updateProject(project.id, formData);
        router.push(`/projects/${project.id}`);
      } else {
        const result = await createProject(formData);
        router.push(`/projects/${result.id}`);
      }
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{isEdit ? "프로젝트 수정" : "새 프로젝트"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">프로젝트명 *</Label>
            <Input
              id="title"
              name="title"
              placeholder="예: 김철수님 주방 싱크대 교체"
              defaultValue={project?.title}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer_id">고객</Label>
            <select
              id="customer_id"
              name="customer_id"
              defaultValue={project?.customer_id || ""}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">고객 선택 (선택사항)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">시공 주소</Label>
            <Input
              id="address"
              name="address"
              defaultValue={project?.address || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={project?.notes || ""}
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : isEdit ? "수정" : "생성"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
