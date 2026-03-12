import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { ScheduleActions } from "@/components/schedule/schedule-actions";
import { getSchedules } from "@/lib/actions/schedules";
import { getProjects } from "@/lib/actions/projects";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const TYPE_LABELS: Record<string, string> = {
  consultation: "상담",
  measuring: "실측",
  design_review: "디자인 검토",
  manufacturing_start: "제작 시작",
  manufacturing_end: "제작 완료",
  delivery: "배송",
  installation: "설치",
  after_service: "A/S",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "완료",
  canceled: "취소",
};

export default async function SchedulePage() {
  let schedules: Awaited<ReturnType<typeof getSchedules>> = [];
  let projects: Array<{ id: string; title: string }> = [];
  let error: string | null = null;

  try {
    [schedules, projects] = await Promise.all([
      getSchedules(),
      getProjects(),
    ]);
  } catch {
    error = "일정을 불러올 수 없습니다. Supabase 설정을 확인하세요.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">일정 관리</h1>
          <p className="text-gray-500">{schedules.length}개의 일정</p>
        </div>
        <ScheduleForm projects={projects} />
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {error}
          </CardContent>
        </Card>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">등록된 일정이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const project = schedule.project as { id: string; title: string } | null;
            return (
              <Card key={schedule.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {format(new Date(schedule.scheduled_date), "dd")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(schedule.scheduled_date), "EEE", {
                          locale: ko,
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{schedule.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {TYPE_LABELS[schedule.type] || schedule.type}
                        </Badge>
                        <Badge
                          className={STATUS_COLORS[schedule.status]}
                          variant="outline"
                        >
                          {STATUS_LABELS[schedule.status]}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {project && `프로젝트: ${project.title}`}
                        {schedule.scheduled_time_start &&
                          ` | ${schedule.scheduled_time_start}`}
                        {schedule.scheduled_time_end &&
                          ` - ${schedule.scheduled_time_end}`}
                      </div>
                      {schedule.notes && (
                        <div className="mt-1 text-xs text-gray-400">
                          {schedule.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <ScheduleActions scheduleId={schedule.id} currentStatus={schedule.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
