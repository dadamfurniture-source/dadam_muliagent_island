"use client";

import type { ProjectStatus } from "@/types";
import { PROJECT_STATUS_LABELS } from "@/types";
import { updateProjectStatus } from "@/lib/actions/projects";

const STATUS_ORDER: ProjectStatus[] = [
  "consultation",
  "measuring",
  "designing",
  "quoting",
  "confirmed",
  "ordering",
  "manufacturing",
  "installing",
  "completed",
  "after_service",
];

export function ProjectStatusSelect({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: ProjectStatus;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as ProjectStatus;
    if (newStatus === currentStatus) return;
    if (!confirm(`상태를 "${PROJECT_STATUS_LABELS[newStatus]}"(으)로 변경하시겠습니까?`)) {
      e.target.value = currentStatus;
      return;
    }
    try {
      await updateProjectStatus(projectId, newStatus);
    } catch {
      alert("상태 변경에 실패했습니다.");
      e.target.value = currentStatus;
    }
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      className="rounded-md border px-3 py-1.5 text-sm"
    >
      {STATUS_ORDER.map((status) => (
        <option key={status} value={status}>
          {PROJECT_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
