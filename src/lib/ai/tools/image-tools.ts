import type { AgentTool } from "@/lib/ai/agents/types";

export const imageTools: AgentTool[] = [
  {
    name: "request_image_generation",
    description:
      "현장사진에 가구를 합성한 AI 이미지 생성을 요청합니다. 사용자가 사진을 업로드하고 가구 정보를 제공한 후 호출합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        furniture_type: {
          type: "string",
          description: "가구 유형 (sink, built_in_closet, shoe_cabinet, vanity, fridge_cabinet, storage)",
        },
        style: { type: "string", description: "스타일 (modern, classic, scandinavian 등)" },
        color: { type: "string", description: "색상" },
        material: { type: "string", description: "자재" },
        width_mm: { type: "number", description: "너비 (mm)" },
        height_mm: { type: "number", description: "높이 (mm)" },
        additional_notes: { type: "string", description: "추가 요청사항" },
      },
      required: ["furniture_type"],
    },
    execute: async (input) => {
      // TODO: Gemini 이미지 생성 파이프라인 연동
      return JSON.stringify({
        success: true,
        status: "pending",
        message: "이미지 생성이 요청되었습니다. 잠시 후 결과를 확인하실 수 있습니다.",
        requestedSpec: input,
      });
    },
  },
  {
    name: "get_generation_status",
    description: "이미지 생성 진행 상태를 확인합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        job_id: { type: "string", description: "이미지 생성 작업 ID" },
      },
      required: ["job_id"],
    },
    execute: async (input) => {
      // TODO: DB에서 상태 조회
      return JSON.stringify({
        job_id: input.job_id,
        status: "completed",
        message: "이미지 생성이 완료되었습니다.",
      });
    },
  },
];
