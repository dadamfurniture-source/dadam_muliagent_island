import type { AgentTool } from "../agents/types";

export const scheduleTools: AgentTool[] = [
  {
    name: "get_available_slots",
    description: "예약 가능한 일정 슬롯을 조회합니다. 실측, 설치 등의 방문 일정을 잡을 때 사용합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        schedule_type: {
          type: "string",
          description: "일정 유형 (consultation, measuring, installation, after_service)",
        },
        preferred_date: {
          type: "string",
          description: "선호 날짜 (YYYY-MM-DD)",
        },
      },
      required: ["schedule_type"],
    },
    execute: async (input) => {
      // TODO: 실제 캘린더 데이터 조회
      const today = new Date();
      const slots = [];
      for (let i = 1; i <= 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        if (date.getDay() !== 0) {
          slots.push({
            date: date.toISOString().split("T")[0],
            times: ["10:00", "14:00", "16:00"],
          });
        }
      }
      return JSON.stringify({
        schedule_type: input.schedule_type,
        available_slots: slots.slice(0, 3),
      });
    },
  },
  {
    name: "create_schedule",
    description: "일정을 등록합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        schedule_type: { type: "string", description: "일정 유형" },
        date: { type: "string", description: "날짜 (YYYY-MM-DD)" },
        time: { type: "string", description: "시간 (HH:mm)" },
        address: { type: "string", description: "방문 주소" },
        notes: { type: "string", description: "메모" },
      },
      required: ["schedule_type", "date", "time"],
    },
    execute: async (input) => {
      // TODO: DB에 일정 저장
      return JSON.stringify({
        success: true,
        message: `${input.date} ${input.time}에 ${input.schedule_type} 일정이 등록되었습니다.`,
        schedule: input,
      });
    },
  },
  {
    name: "update_project_status",
    description: "프로젝트 워크플로우 상태를 변경합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "프로젝트 ID" },
        new_status: {
          type: "string",
          description: "새 상태 (consultation, measuring, designing, quoting, confirmed, ordering, manufacturing, installing, completed, after_service)",
        },
      },
      required: ["project_id", "new_status"],
    },
    execute: async (input) => {
      // TODO: DB 업데이트
      return JSON.stringify({
        success: true,
        message: `프로젝트 상태가 ${input.new_status}(으)로 변경되었습니다.`,
      });
    },
  },
];
