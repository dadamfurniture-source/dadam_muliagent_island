"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSchedule } from "@/lib/actions/schedules";

const SCHEDULE_TYPES = [
  { value: "consultation", label: "상담" },
  { value: "measuring", label: "실측" },
  { value: "design_review", label: "디자인 검토" },
  { value: "manufacturing_start", label: "제작 시작" },
  { value: "manufacturing_end", label: "제작 완료" },
  { value: "delivery", label: "배송" },
  { value: "installation", label: "설치" },
  { value: "after_service", label: "A/S" },
];

interface ScheduleFormProps {
  projects: Array<{ id: string; title: string }>;
}

export function ScheduleForm({ projects }: ScheduleFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await createSchedule(formData);
      setOpen(false);
    } catch {
      alert("일정 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>+ 일정 등록</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>일정 등록</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project_id">프로젝트 *</Label>
            <select
              id="project_id"
              name="project_id"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">프로젝트 선택</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">유형 *</Label>
            <select
              id="type"
              name="type"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {SCHEDULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_date">날짜 *</Label>
            <Input
              id="scheduled_date"
              name="scheduled_date"
              type="date"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scheduled_time_start">시작 시간</Label>
              <Input
                id="scheduled_time_start"
                name="scheduled_time_start"
                type="time"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time_end">종료 시간</Label>
              <Input
                id="scheduled_time_end"
                name="scheduled_time_end"
                type="time"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">메모</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "등록 중..." : "일정 등록"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
