"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateScheduleStatus, deleteSchedule } from "@/lib/actions/schedules";

interface ScheduleActionsProps {
  scheduleId: string;
  currentStatus: string;
}

export function ScheduleActions({
  scheduleId,
  currentStatus,
}: ScheduleActionsProps) {
  async function handleStatusChange(
    status: "scheduled" | "in_progress" | "completed" | "canceled",
  ) {
    try {
      await updateScheduleStatus(scheduleId, status);
    } catch {
      alert("상태 변경에 실패했습니다.");
    }
  }

  async function handleDelete() {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    try {
      await deleteSchedule(scheduleId);
    } catch {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="cursor-pointer px-2 text-gray-400 hover:text-gray-600">
          ⋮
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== "in_progress" && (
          <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
            진행 중으로 변경
          </DropdownMenuItem>
        )}
        {currentStatus !== "completed" && (
          <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
            완료로 변경
          </DropdownMenuItem>
        )}
        {currentStatus !== "canceled" && (
          <DropdownMenuItem onClick={() => handleStatusChange("canceled")}>
            취소
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
