import type { AgentTool } from "@/lib/ai/agents/types";

export const imageTools: AgentTool[] = [
  {
    name: "request_image_generation",
    description:
      "현장사진에 가구를 합성한 AI 이미지 생성을 요청합니다. 사용자가 사진을 업로드하고 가구 정보를 제공한 후 호출합니다. 이 도구는 생성 요청을 기록하고, 실제 생성은 클라이언트에서 처리됩니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        furniture_type: {
          type: "string",
          description: "가구 유형 (sink, built_in_closet, shoe_cabinet, vanity, fridge_cabinet, storage)",
        },
        style: { type: "string", description: "스타일 (modern, classic, scandinavian, minimal, industrial 등)" },
        color: { type: "string", description: "색상 (화이트, 우드톤, 그레이 등)" },
        material: { type: "string", description: "자재 (원목, MDF, 합판, PB, 하이그로시 등)" },
        width_mm: { type: "number", description: "너비 (mm)" },
        height_mm: { type: "number", description: "높이 (mm)" },
        additional_notes: { type: "string", description: "추가 요청사항" },
      },
      required: ["furniture_type"],
    },
    execute: async (input) => {
      // 에이전트가 이 도구를 호출하면, 생성 파라미터를 반환
      // 실제 이미지 생성은 API route에서 처리 (sourceImage가 필요하므로)
      return JSON.stringify({
        success: true,
        action: "generate_image",
        status: "ready",
        message: "이미지 생성 준비가 완료되었습니다. 현장사진과 함께 생성을 시작합니다.",
        params: {
          furnitureType: input.furniture_type,
          style: input.style || null,
          color: input.color || null,
          material: input.material || null,
          widthMm: input.width_mm || null,
          heightMm: input.height_mm || null,
          additionalNotes: input.additional_notes || null,
        },
      });
    },
  },
  {
    name: "check_image_usage",
    description: "사용자의 이번 달 이미지 생성 사용량을 확인합니다.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
    execute: async () => {
      // 실제로는 API route에서 context의 userId를 통해 조회
      // 에이전트 도구에서는 클라이언트 측 요청이 필요
      return JSON.stringify({
        success: true,
        action: "check_usage",
        message: "사용량 확인을 위해 서버에 요청합니다.",
      });
    },
  },
  {
    name: "suggest_furniture_style",
    description: "현장사진을 분석하여 어울리는 가구 스타일, 색상, 자재를 추천합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        space_type: {
          type: "string",
          description: "공간 유형 (주방, 거실, 침실, 현관, 드레스룸 등)",
        },
        furniture_type: {
          type: "string",
          description: "가구 유형",
        },
        existing_style: {
          type: "string",
          description: "현재 인테리어 스타일 (사용자 설명 기반)",
        },
      },
      required: ["space_type", "furniture_type"],
    },
    execute: async (input) => {
      // 스타일 추천 로직 (공간+가구 유형 기반)
      const recommendations: Record<string, { styles: string[]; colors: string[]; materials: string[] }> = {
        주방: {
          styles: ["모던", "미니멀", "클래식"],
          colors: ["화이트", "그레이", "우드톤"],
          materials: ["하이그로시", "PET", "원목"],
        },
        거실: {
          styles: ["스칸디나비안", "모던", "내추럴"],
          colors: ["화이트", "아이보리", "월넛"],
          materials: ["원목", "MDF", "합판"],
        },
        침실: {
          styles: ["미니멀", "모던", "클래식"],
          colors: ["화이트", "아이보리", "라이트그레이"],
          materials: ["MDF", "원목", "PB"],
        },
        현관: {
          styles: ["모던", "미니멀"],
          colors: ["화이트", "그레이", "우드톤"],
          materials: ["MDF", "PB", "하이그로시"],
        },
        드레스룸: {
          styles: ["모던", "미니멀", "럭셔리"],
          colors: ["화이트", "그레이", "다크우드"],
          materials: ["MDF", "하이그로시", "PET"],
        },
      };

      const rec = recommendations[input.space_type as string] || recommendations["거실"];

      return JSON.stringify({
        success: true,
        spaceType: input.space_type,
        furnitureType: input.furniture_type,
        recommendations: rec,
        message: `${input.space_type} 공간에 어울리는 ${input.furniture_type} 스타일을 추천합니다.`,
      });
    },
  },
];
