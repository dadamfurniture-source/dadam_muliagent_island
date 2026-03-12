import type { AgentTool } from "../agents/types";
import { FURNITURE_TYPE_LABELS } from "@/types";

export const consultationTools: AgentTool[] = [
  {
    name: "get_furniture_types",
    description:
      "사용 가능한 가구 유형 목록을 조회합니다. 고객에게 어떤 가구를 제작할 수 있는지 안내할 때 사용합니다.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
    execute: async () => {
      const types = Object.entries(FURNITURE_TYPE_LABELS).map(
        ([key, label]) => ({ code: key, name: label }),
      );
      return JSON.stringify(types, null, 2);
    },
  },
  {
    name: "get_furniture_styles",
    description: "선택 가능한 가구 스타일 목록을 조회합니다.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
    execute: async () => {
      const styles = [
        { code: "modern", name: "모던", description: "깔끔한 직선과 미니멀한 디자인" },
        { code: "classic", name: "클래식", description: "전통적이고 우아한 디자인" },
        { code: "scandinavian", name: "북유럽", description: "밝고 따뜻한 자연 소재 중심" },
        { code: "industrial", name: "인더스트리얼", description: "금속과 원목의 조화" },
        { code: "minimal", name: "미니멀", description: "최소한의 요소로 구성된 깔끔한 디자인" },
        { code: "natural", name: "내추럴", description: "자연 친화적 소재와 색감" },
      ];
      return JSON.stringify(styles, null, 2);
    },
  },
  {
    name: "get_materials",
    description: "사용 가능한 자재 목록과 등급을 조회합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        furniture_type: {
          type: "string",
          description: "가구 유형 코드 (sink, built_in_closet 등)",
        },
      },
      required: [],
    },
    execute: async () => {
      const materials = [
        { code: "lpm", name: "LPM (저압 멜라민)", grade: "기본", priceRange: "경제적" },
        { code: "hpm", name: "HPM (고압 멜라민)", grade: "중급", priceRange: "보통" },
        { code: "high_gloss", name: "하이글로시", grade: "중상", priceRange: "중상" },
        { code: "pet", name: "PET 필름", grade: "중급", priceRange: "보통" },
        { code: "uv", name: "UV 코팅", grade: "중상", priceRange: "중상" },
        { code: "solid_wood", name: "원목", grade: "고급", priceRange: "고가" },
        { code: "ceramic", name: "세라믹/포세린", grade: "최고급", priceRange: "최고가" },
      ];
      return JSON.stringify(materials, null, 2);
    },
  },
  {
    name: "save_consultation_summary",
    description:
      "상담 내용을 요약하여 저장합니다. 고객의 요구사항이 충분히 파악되었을 때 호출합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        customer_name: { type: "string", description: "고객 이름" },
        furniture_type: { type: "string", description: "가구 유형 코드" },
        style: { type: "string", description: "선호 스타일" },
        material: { type: "string", description: "선호 자재" },
        color: { type: "string", description: "선호 색상" },
        width_mm: { type: "number", description: "너비 (mm)" },
        height_mm: { type: "number", description: "높이 (mm)" },
        depth_mm: { type: "number", description: "깊이 (mm)" },
        budget: { type: "string", description: "예산 범위" },
        additional_notes: { type: "string", description: "추가 요청사항" },
        space_type: { type: "string", description: "설치 공간 (주방, 거실 등)" },
      },
      required: ["furniture_type"],
    },
    execute: async (input) => {
      // TODO: DB에 저장 (Supabase 연동 후)
      return JSON.stringify({
        success: true,
        message: "상담 내용이 저장되었습니다.",
        summary: input,
      });
    },
  },
  {
    name: "suggest_next_step",
    description:
      "다음 단계를 제안합니다. 이미지 생성, 견적 요청, 실측 예약 등을 안내합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        has_photo: { type: "boolean", description: "현장사진이 있는지 여부" },
        has_dimensions: { type: "boolean", description: "치수 정보가 있는지 여부" },
        has_material: { type: "boolean", description: "자재가 선택되었는지 여부" },
      },
      required: ["has_photo", "has_dimensions", "has_material"],
    },
    execute: async (input) => {
      const suggestions: string[] = [];

      if (!input.has_photo) {
        suggestions.push("현장사진을 업로드하면 AI가 가구를 합성한 이미지를 보여드릴 수 있습니다.");
      }
      if (input.has_photo) {
        suggestions.push("AI 이미지 생성을 진행할 수 있습니다.");
      }
      if (input.has_dimensions && input.has_material) {
        suggestions.push("간단 견적을 바로 산출할 수 있습니다.");
      }
      if (!input.has_dimensions) {
        suggestions.push("실측 방문을 예약하여 정확한 치수를 확인할 수 있습니다.");
      }

      return JSON.stringify({ suggestions });
    },
  },
];
