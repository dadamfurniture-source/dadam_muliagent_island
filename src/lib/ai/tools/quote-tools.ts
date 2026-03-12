import type { AgentTool } from "@/lib/ai/agents/types";

export const quoteTools: AgentTool[] = [
  {
    name: "calculate_estimate",
    description:
      "품목 정보를 기반으로 간단 견적을 산출합니다. 가구 유형, 사이즈, 자재 정보가 필요합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        furniture_type: {
          type: "string",
          description: "가구 유형 코드",
        },
        width_mm: { type: "number", description: "너비 (mm)" },
        height_mm: { type: "number", description: "높이 (mm)" },
        depth_mm: { type: "number", description: "깊이 (mm)" },
        material: { type: "string", description: "자재 종류" },
        quantity: { type: "number", description: "수량" },
      },
      required: ["furniture_type", "width_mm", "height_mm"],
    },
    execute: async (input) => {
      // 간이 견적 로직 (추후 정교화)
      const basePrices: Record<string, number> = {
        sink: 800000,
        built_in_closet: 1500000,
        shoe_cabinet: 500000,
        vanity: 700000,
        fridge_cabinet: 500000,
        storage: 600000,
        other: 600000,
      };

      const materialMultiplier: Record<string, number> = {
        lpm: 1.0,
        hpm: 1.15,
        pet: 1.2,
        high_gloss: 1.4,
        uv: 1.35,
        solid_wood: 2.2,
        ceramic: 3.0,
      };

      const furnitureType = input.furniture_type as string;
      const material = (input.material as string) || "lpm";
      const quantity = (input.quantity as number) || 1;
      const width = (input.width_mm as number) || 1000;

      const basePrice = basePrices[furnitureType] || 600000;
      const sizeMultiplier = Math.max(0.7, width / 1000);
      const matMultiplier = materialMultiplier[material] || 1.0;

      const materialCost = Math.round(basePrice * sizeMultiplier * matMultiplier);
      const laborCost = Math.round(materialCost * 0.3);
      const deliveryCost = 50000;
      const total = (materialCost + laborCost + deliveryCost) * quantity;

      return JSON.stringify({
        estimate: {
          furniture_type: furnitureType,
          material_cost: materialCost,
          labor_cost: laborCost,
          delivery_cost: deliveryCost,
          quantity,
          total,
          currency: "KRW",
          note: "이 견적은 AI 추정치이며, 실측 후 정확한 견적이 제공됩니다.",
        },
      });
    },
  },
  {
    name: "generate_quote_pdf",
    description: "견적서를 PDF로 생성합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "프로젝트 ID" },
      },
      required: ["project_id"],
    },
    execute: async (input) => {
      // TODO: PDF 생성 연동
      return JSON.stringify({
        success: true,
        message: "견적서 PDF 생성 기능은 준비 중입니다.",
        project_id: input.project_id,
      });
    },
  },
];
