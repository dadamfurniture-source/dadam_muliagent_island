import type { AgentTool } from "@/lib/ai/agents/types";

export const drawingTools: AgentTool[] = [
  {
    name: "analyze_drawing_requirements",
    description: "고객의 요구사항을 분석하여 도면 작성에 필요한 정보를 정리합니다.",
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
        width_mm: { type: "number", description: "공간 너비 (mm)" },
        height_mm: { type: "number", description: "공간 높이 (mm)" },
        depth_mm: { type: "number", description: "공간 깊이 (mm)" },
        obstacles: {
          type: "array",
          items: { type: "string" },
          description: "장애물 목록 (콘센트, 배관, 기둥, 창문 등)",
        },
        requirements: {
          type: "string",
          description: "추가 요구사항",
        },
      },
      required: ["space_type", "furniture_type"],
    },
    execute: async (input) => {
      const suggestions: Record<string, string[]> = {
        주방: [
          "상부장과 하부장의 높이를 사용자 키에 맞게 조정하세요 (일반적으로 상부장 하단: 1,450mm)",
          "싱크대 너비는 최소 600mm, 작업 공간 확보를 위해 900mm 권장",
          "가스레인지와 싱크대 사이 최소 400mm 작업대 확보",
          "냉장고장은 냉장고 규격 + 양쪽 20mm 여유 필요",
        ],
        거실: [
          "TV장은 TV 크기에 맞게 너비 결정 (55인치: 최소 1,400mm)",
          "수납장 깊이는 350~450mm가 적당",
          "바닥에서 선반까지 높이: 전시용 1,200mm, 수납용 자유",
        ],
        침실: [
          "붙박이장 깊이는 최소 580mm (옷걸이 수납)",
          "슬라이딩 도어는 이동 공간 절약에 유리",
          "서랍장은 높이 750~900mm 권장",
        ],
        현관: [
          "신발장 깊이는 350mm (일반 신발) ~ 400mm (부츠)",
          "벤치형 하부는 높이 450mm 권장",
          "우산꽂이 공간 고려",
        ],
        드레스룸: [
          "행잉 공간: 긴 옷 1,500mm, 짧은 옷 900mm",
          "서랍: 속옷/양말용 높이 150mm, 니트류 250mm",
          "거울 설치 위치 고려",
        ],
      };

      const spaceType = input.space_type as string;
      const tips = suggestions[spaceType] || suggestions["거실"];

      return JSON.stringify({
        success: true,
        analysis: {
          space_type: spaceType,
          furniture_type: input.furniture_type,
          dimensions: {
            width_mm: input.width_mm || "미입력",
            height_mm: input.height_mm || "미입력",
            depth_mm: input.depth_mm || "미입력",
          },
          obstacles: input.obstacles || [],
          requirements: input.requirements || "없음",
        },
        design_tips: tips,
        message: "도면 작성을 위한 분석이 완료되었습니다. 프로젝트 상세 페이지에서 '새 도면' 버튼을 눌러 Excalidraw 에디터에서 도면을 작성할 수 있습니다.",
      });
    },
  },
  {
    name: "convert_drawing_to_image_prompt",
    description: "도면 데이터를 분석하여 AI 이미지 생성에 적합한 프롬프트로 변환합니다. 프로+ 플랜에서만 사용 가능합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        drawing_description: {
          type: "string",
          description: "도면에 대한 설명 (가구 유형, 구조, 치수 등)",
        },
        furniture_type: {
          type: "string",
          description: "가구 유형",
        },
        style: {
          type: "string",
          description: "원하는 스타일",
        },
        material: {
          type: "string",
          description: "자재",
        },
        color: {
          type: "string",
          description: "색상",
        },
      },
      required: ["drawing_description", "furniture_type"],
    },
    execute: async (input) => {
      const furnitureLabels: Record<string, string> = {
        sink: "싱크대", built_in_closet: "붙박이장",
        shoe_cabinet: "신발장", vanity: "화장대",
        fridge_cabinet: "냉장고장", storage: "수납장",
      };

      const furnitureType = input.furniture_type as string;
      const label = furnitureLabels[furnitureType] || furnitureType;

      const parts = [
        `도면 기반 ${label} 3D 렌더링 이미지를 생성합니다.`,
        `구조: ${input.drawing_description}`,
      ];

      if (input.style) parts.push(`스타일: ${input.style}`);
      if (input.material) parts.push(`자재: ${input.material}`);
      if (input.color) parts.push(`색상: ${input.color}`);

      parts.push("사실적인 재질감과 그림자를 포함한 고품질 3D 렌더링으로 생성해주세요.");

      const imagePrompt = parts.join("\n");

      return JSON.stringify({
        success: true,
        action: "drawing_to_image",
        prompt: imagePrompt,
        furniture_type: furnitureType,
        message: `도면→이미지 프롬프트가 준비되었습니다. 도면 에디터에서 'AI 이미지 생성' 버튼을 눌러 실행할 수 있습니다.`,
      });
    },
  },
  {
    name: "suggest_dimensions",
    description: "공간과 가구 유형에 따른 권장 치수를 제안합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        furniture_type: { type: "string", description: "가구 유형" },
        space_width_mm: { type: "number", description: "가용 공간 너비 (mm)" },
        space_height_mm: { type: "number", description: "천장 높이 (mm)" },
      },
      required: ["furniture_type"],
    },
    execute: async (input) => {
      const defaults: Record<string, { width: number; height: number; depth: number; notes: string }> = {
        sink: { width: 2400, height: 850, depth: 600, notes: "상부장 높이: 700mm, 하부장 높이: 850mm" },
        built_in_closet: { width: 3600, height: 2400, depth: 600, notes: "행잉: 1500mm, 선반: 나머지" },
        shoe_cabinet: { width: 1200, height: 1200, depth: 350, notes: "칸 높이: 180~220mm" },
        vanity: { width: 1000, height: 750, depth: 450, notes: "거울 높이 별도" },
        fridge_cabinet: { width: 700, height: 2100, depth: 650, notes: "냉장고 규격 + 여유 20mm" },
        storage: { width: 1200, height: 1800, depth: 400, notes: "선반 간격: 300~400mm" },
      };

      const furnitureType = input.furniture_type as string;
      const dim = defaults[furnitureType] || defaults["storage"];
      const spaceWidth = input.space_width_mm as number;
      const spaceHeight = input.space_height_mm as number;

      return JSON.stringify({
        furniture_type: furnitureType,
        recommended: {
          width_mm: spaceWidth ? Math.min(dim.width, spaceWidth) : dim.width,
          height_mm: spaceHeight ? Math.min(dim.height, spaceHeight - 50) : dim.height,
          depth_mm: dim.depth,
        },
        notes: dim.notes,
        message: "권장 치수를 참고하여 도면을 작성해주세요.",
      });
    },
  },
];
