import type { AgentTool } from "@/lib/ai/agents/types";
import { createClient } from "@/lib/supabase/server";

async function getSupabase() {
  return await createClient();
}

export const scheduleTools: AgentTool[] = [
  {
    name: "get_available_slots",
    description:
      "특정 날짜 범위에서 예약 가능한 일정 슬롯을 조회합니다. 실측, 설치 등의 방문 일정을 잡을 때 사용합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        schedule_type: {
          type: "string",
          description:
            "일정 유형 (consultation, measuring, design_review, installation, after_service)",
        },
        preferred_date: {
          type: "string",
          description: "선호 날짜 (YYYY-MM-DD). 미입력 시 오늘부터 탐색",
        },
        days_ahead: {
          type: "number",
          description: "검색 범위 (일, 기본 7)",
        },
      },
      required: ["schedule_type"],
    },
    execute: async (input) => {
      const supabase = await getSupabase();
      const daysAhead = (input.days_ahead as number) || 7;
      const startDate =
        (input.preferred_date as string) ||
        new Date().toISOString().slice(0, 10);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysAhead);
      const endDateStr = endDate.toISOString().slice(0, 10);

      // 해당 기간의 기존 일정 조회
      const { data: existingSchedules } = await supabase
        .from("schedules")
        .select("scheduled_date, scheduled_time_start")
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDateStr)
        .neq("status", "canceled");

      const busyMap = new Map<string, Set<string>>();
      for (const s of existingSchedules || []) {
        const date = s.scheduled_date;
        if (!busyMap.has(date)) busyMap.set(date, new Set());
        if (s.scheduled_time_start) {
          busyMap.get(date)!.add(s.scheduled_time_start.slice(0, 5));
        }
      }

      const allSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
      const available: { date: string; day: string; times: string[] }[] = [];
      const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

      const cur = new Date(startDate);
      for (let i = 0; i < daysAhead; i++) {
        const dateStr = cur.toISOString().slice(0, 10);
        const dayOfWeek = cur.getDay();

        // 일요일 제외
        if (dayOfWeek !== 0) {
          const busy = busyMap.get(dateStr) || new Set();
          const freeSlots = allSlots.filter((t) => !busy.has(t));
          if (freeSlots.length > 0) {
            available.push({
              date: dateStr,
              day: dayLabels[dayOfWeek],
              times: freeSlots,
            });
          }
        }
        cur.setDate(cur.getDate() + 1);
      }

      return JSON.stringify({
        schedule_type: input.schedule_type,
        search_range: { from: startDate, to: endDateStr },
        available_slots: available.slice(0, 5),
        total_existing: existingSchedules?.length || 0,
      });
    },
  },
  {
    name: "create_schedule",
    description:
      "프로젝트에 일정을 등록하고 알림을 생성합니다. 프로젝트 ID가 필요합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "프로젝트 ID" },
        schedule_type: {
          type: "string",
          description:
            "일정 유형 (consultation, measuring, design_review, manufacturing_start, manufacturing_end, delivery, installation, after_service)",
        },
        title: { type: "string", description: "일정 제목" },
        date: { type: "string", description: "날짜 (YYYY-MM-DD)" },
        time_start: { type: "string", description: "시작 시간 (HH:mm)" },
        time_end: { type: "string", description: "종료 시간 (HH:mm, 선택)" },
        notes: { type: "string", description: "메모" },
      },
      required: ["project_id", "schedule_type", "title", "date"],
    },
    execute: async (input) => {
      const supabase = await getSupabase();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return JSON.stringify({ success: false, error: "인증 필요" });

      const projectId = input.project_id as string;
      const scheduleType = input.schedule_type as string;
      const title = input.title as string;
      const date = input.date as string;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return JSON.stringify({ success: false, error: "잘못된 날짜 형식" });
      }

      const timeStart = (input.time_start as string) || null;
      const timeEnd = (input.time_end as string) || null;
      const timeRegex = /^\d{2}:\d{2}$/;
      if (timeStart && !timeRegex.test(timeStart)) {
        return JSON.stringify({ success: false, error: "잘못된 시작 시간 형식 (HH:mm)" });
      }
      if (timeEnd && !timeRegex.test(timeEnd)) {
        return JSON.stringify({ success: false, error: "잘못된 종료 시간 형식 (HH:mm)" });
      }

      const { data, error } = await supabase
        .from("schedules")
        .insert({
          owner_id: user.id,
          project_id: projectId,
          type: scheduleType,
          title,
          scheduled_date: date,
          scheduled_time_start: timeStart,
          scheduled_time_end: timeEnd,
          notes: (input.notes as string) || null,
        })
        .select("id")
        .single();

      if (error) {
        return JSON.stringify({ success: false, error: error.message });
      }

      // 알림 생성
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

      await supabase.from("notifications").insert({
        owner_id: user.id,
        type: "schedule_reminder",
        title: `${TYPE_LABELS[scheduleType] || scheduleType} 일정 등록`,
        message: `${date} ${(input.time_start as string) || ""} - ${title}`,
        link: "/schedule",
      });

      return JSON.stringify({
        success: true,
        schedule_id: data.id,
        message: `${date} ${(input.time_start as string) || ""}에 "${title}" 일정이 등록되었습니다.`,
      });
    },
  },
  {
    name: "update_project_status",
    description:
      "프로젝트 워크플로우 상태를 다음 단계로 변경합니다. 상태 전이 규칙을 자동 검증합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "프로젝트 ID" },
        new_status: {
          type: "string",
          description:
            "새 상태 (consultation, measuring, designing, quoting, confirmed, ordering, manufacturing, installing, completed, after_service)",
        },
        reason: {
          type: "string",
          description: "상태 변경 사유",
        },
      },
      required: ["project_id", "new_status"],
    },
    execute: async (input) => {
      const supabase = await getSupabase();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return JSON.stringify({ success: false, error: "인증 필요" });

      const projectId = input.project_id as string;
      const newStatus = input.new_status as string;

      // 현재 상태 조회
      const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("id, title, status")
        .eq("id", projectId)
        .single();

      if (fetchError || !project) {
        return JSON.stringify({ success: false, error: "프로젝트를 찾을 수 없습니다." });
      }

      // 워크플로우 순서 정의
      const WORKFLOW_ORDER = [
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

      const currentIdx = WORKFLOW_ORDER.indexOf(project.status);
      const newIdx = WORKFLOW_ORDER.indexOf(newStatus);

      if (newIdx === -1) {
        return JSON.stringify({ success: false, error: `잘못된 상태: ${newStatus}` });
      }

      // 역방향 전이 경고 (A/S 제외)
      if (newIdx < currentIdx && newStatus !== "after_service") {
        return JSON.stringify({
          success: false,
          error: `현재 "${project.status}" 상태에서 "${newStatus}"(으)로 되돌릴 수 없습니다. 워크플로우는 순방향으로만 진행됩니다.`,
          current_status: project.status,
          requested_status: newStatus,
        });
      }

      // 2단계 이상 건너뛰기 경고
      if (newIdx > currentIdx + 1 && newStatus !== "after_service") {
        return JSON.stringify({
          success: false,
          error: `"${project.status}"에서 "${newStatus}"(으)로 바로 건너뛸 수 없습니다. 다음 단계는 "${WORKFLOW_ORDER[currentIdx + 1]}"입니다.`,
          current_status: project.status,
          next_step: WORKFLOW_ORDER[currentIdx + 1],
        });
      }

      // 상태 업데이트
      const { error: updateError } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (updateError) {
        return JSON.stringify({ success: false, error: updateError.message });
      }

      // 상태 변경 알림
      const STATUS_LABELS: Record<string, string> = {
        consultation: "상담",
        measuring: "실측",
        designing: "설계/디자인",
        quoting: "견적",
        confirmed: "확정",
        ordering: "발주",
        manufacturing: "제작",
        installing: "설치",
        completed: "완료",
        after_service: "A/S",
      };

      await supabase.from("notifications").insert({
        owner_id: user.id,
        type: "project_status",
        title: `${project.title} - ${STATUS_LABELS[newStatus] || newStatus} 단계`,
        message: `프로젝트가 "${STATUS_LABELS[newStatus]}" 단계로 변경되었습니다.${input.reason ? ` 사유: ${input.reason}` : ""}`,
        link: `/projects/${projectId}`,
      });

      return JSON.stringify({
        success: true,
        project_id: projectId,
        project_title: project.title,
        previous_status: project.status,
        new_status: newStatus,
        message: `"${project.title}" 프로젝트가 "${STATUS_LABELS[newStatus]}" 단계로 변경되었습니다.`,
      });
    },
  },
  {
    name: "get_project_workflow",
    description:
      "프로젝트의 현재 워크플로우 상태와 진행 이력을 조회합니다. 다음 단계 제안도 포함합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "프로젝트 ID" },
      },
      required: ["project_id"],
    },
    execute: async (input) => {
      const supabase = await getSupabase();
      const projectId = input.project_id as string;

      const [projectRes, schedulesRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, title, status, created_at, updated_at, customer:customers(name)")
          .eq("id", projectId)
          .single(),
        supabase
          .from("schedules")
          .select("type, title, scheduled_date, status")
          .eq("project_id", projectId)
          .order("scheduled_date", { ascending: true }),
      ]);

      if (projectRes.error || !projectRes.data) {
        return JSON.stringify({ success: false, error: "프로젝트를 찾을 수 없습니다." });
      }

      const project = projectRes.data;
      const schedules = schedulesRes.data || [];

      const WORKFLOW = [
        { status: "consultation", label: "상담", actions: ["고객 요구사항 파악", "가구 유형 결정"] },
        { status: "measuring", label: "실측", actions: ["현장 방문", "치수 측정", "장애물 확인"] },
        { status: "designing", label: "설계", actions: ["도면 작성", "디자인 확정", "자재 선정"] },
        { status: "quoting", label: "견적", actions: ["견적서 작성", "고객 검토"] },
        { status: "confirmed", label: "확정", actions: ["계약 체결", "선수금 수령"] },
        { status: "ordering", label: "발주", actions: ["자재 발주", "납기 확인"] },
        { status: "manufacturing", label: "제작", actions: ["제작 진행", "품질 검수"] },
        { status: "installing", label: "설치", actions: ["현장 설치", "마감 처리"] },
        { status: "completed", label: "완료", actions: ["최종 검수", "잔금 수령"] },
        { status: "after_service", label: "A/S", actions: ["하자 점검", "보수 작업"] },
      ];

      const currentIdx = WORKFLOW.findIndex((w) => w.status === project.status);
      const currentStep = WORKFLOW[currentIdx];
      const nextStep = currentIdx < WORKFLOW.length - 1 ? WORKFLOW[currentIdx + 1] : null;

      return JSON.stringify({
        success: true,
        project: {
          id: project.id,
          title: project.title,
          customer: (project.customer as unknown as { name: string } | null)?.name || "-",
          created_at: project.created_at,
        },
        workflow: {
          current_status: project.status,
          current_label: currentStep?.label,
          current_actions: currentStep?.actions,
          progress: `${currentIdx + 1}/10`,
          next_step: nextStep
            ? { status: nextStep.status, label: nextStep.label, actions: nextStep.actions }
            : null,
        },
        related_schedules: schedules.map((s) => ({
          type: s.type,
          title: s.title,
          date: s.scheduled_date,
          status: s.status,
        })),
        suggestion: nextStep
          ? `다음 단계는 "${nextStep.label}"입니다. ${nextStep.actions.join(", ")} 등의 작업이 필요합니다.`
          : "프로젝트가 최종 단계입니다.",
      });
    },
  },
  {
    name: "suggest_next_actions",
    description:
      "프로젝트 현재 상태에 기반하여 다음 수행해야 할 작업과 일정을 제안합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "프로젝트 ID" },
      },
      required: ["project_id"],
    },
    execute: async (input) => {
      const supabase = await getSupabase();
      const projectId = input.project_id as string;

      const { data: project } = await supabase
        .from("projects")
        .select("id, title, status, address")
        .eq("id", projectId)
        .single();

      if (!project) {
        return JSON.stringify({ success: false, error: "프로젝트를 찾을 수 없습니다." });
      }

      const NEXT_ACTIONS: Record<string, { actions: string[]; schedule_type?: string; schedule_title?: string; estimated_days?: number }> = {
        consultation: {
          actions: ["실측 일정 잡기", "고객에게 방문 시간 확인", "실측 도구 준비"],
          schedule_type: "measuring",
          schedule_title: `${project.title} 실측`,
          estimated_days: 3,
        },
        measuring: {
          actions: ["실측 데이터 기반 도면 작성", "디자인 시안 준비", "자재 후보 선정"],
          schedule_type: "design_review",
          schedule_title: `${project.title} 디자인 검토`,
          estimated_days: 7,
        },
        designing: {
          actions: ["견적서 작성", "자재별 단가 확인", "고객에게 견적 공유"],
          estimated_days: 3,
        },
        quoting: {
          actions: ["고객 의사 확인", "계약서 준비", "선수금 안내"],
          estimated_days: 5,
        },
        confirmed: {
          actions: ["자재 발주", "납기일 확인", "제작 일정 수립"],
          schedule_type: "manufacturing_start",
          schedule_title: `${project.title} 제작 시작`,
          estimated_days: 5,
        },
        ordering: {
          actions: ["자재 입고 확인", "제작 착수", "제작 진도 관리"],
          estimated_days: 14,
        },
        manufacturing: {
          actions: ["품질 검수", "설치 일정 잡기", "고객에게 설치 일시 안내"],
          schedule_type: "installation",
          schedule_title: `${project.title} 설치`,
          estimated_days: 3,
        },
        installing: {
          actions: ["최종 검수", "마감 처리 확인", "잔금 수령", "고객 만족도 확인"],
          estimated_days: 1,
        },
        completed: {
          actions: ["A/S 기간 안내", "고객 후기 요청", "프로젝트 정리"],
          estimated_days: 30,
        },
        after_service: {
          actions: ["하자 내용 확인", "보수 일정 잡기", "보수 작업 수행"],
          schedule_type: "after_service",
          schedule_title: `${project.title} A/S`,
          estimated_days: 3,
        },
      };

      const suggestion = NEXT_ACTIONS[project.status];
      if (!suggestion) {
        return JSON.stringify({ success: false, error: "알 수 없는 상태" });
      }

      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + (suggestion.estimated_days || 3));
      // 일요일이면 +1
      if (suggestedDate.getDay() === 0) suggestedDate.setDate(suggestedDate.getDate() + 1);

      return JSON.stringify({
        success: true,
        project: { id: project.id, title: project.title, status: project.status },
        next_actions: suggestion.actions,
        recommended_schedule: suggestion.schedule_type
          ? {
              type: suggestion.schedule_type,
              title: suggestion.schedule_title,
              suggested_date: suggestedDate.toISOString().slice(0, 10),
            }
          : null,
        message: `현재 "${project.status}" 단계입니다. 다음 작업: ${suggestion.actions.join(", ")}`,
      });
    },
  },
];
