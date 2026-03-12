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
          description: "가구 유형 (sink, built_in_closet, shoe_cabinet, vanity, fridge_cabinet, storage)",
        },
        width_mm: { type: "number", description: "너비 (mm)" },
        height_mm: { type: "number", description: "높이 (mm)" },
        depth_mm: { type: "number", description: "깊이 (mm)" },
        material: {
          type: "string",
          description: "자재 종류 (lpm, mdf, hpm, pet, high_gloss, uv, solid_wood, ceramic)",
        },
        quantity: { type: "number", description: "수량 (기본 1)" },
      },
      required: ["furniture_type", "width_mm", "height_mm"],
    },
    execute: async (input) => {
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
        pb: 1.0,
        mdf: 1.15,
        hpm: 1.15,
        pet: 1.2,
        melamine: 1.1,
        high_gloss: 1.4,
        uv: 1.35,
        solid_wood: 2.2,
        ceramic: 3.0,
      };

      const furnitureLabels: Record<string, string> = {
        sink: "싱크대",
        built_in_closet: "붙박이장",
        shoe_cabinet: "신발장",
        vanity: "화장대",
        fridge_cabinet: "냉장고장",
        storage: "수납장",
      };

      const materialLabels: Record<string, string> = {
        lpm: "LPM",
        pb: "PB",
        mdf: "MDF",
        hpm: "HPM",
        pet: "PET",
        melamine: "멜라민",
        high_gloss: "하이그로시",
        uv: "UV코팅",
        solid_wood: "원목",
        ceramic: "세라믹",
      };

      const furnitureType = input.furniture_type as string;
      const material = (input.material as string) || "lpm";
      const quantity = Math.max(1, (input.quantity as number) || 1);
      const width = (input.width_mm as number) || 1000;
      const height = (input.height_mm as number) || 0;
      const depth = (input.depth_mm as number) || 0;

      const basePrice = basePrices[furnitureType] || 600000;
      const sizeMultiplier = Math.max(0.7, width / 1000);
      const matMultiplier = materialMultiplier[material] || 1.0;

      const materialCost = Math.round(basePrice * sizeMultiplier * matMultiplier);
      const laborCost = Math.round(materialCost * 0.25);
      const deliveryCost = 50000;
      const subtotal = (materialCost + laborCost + deliveryCost) * quantity;
      const tax = Math.round(subtotal * 0.1);
      const total = subtotal + tax;

      const specParts = [`W${width}mm`];
      if (height > 0) specParts.push(`H${height}mm`);
      if (depth > 0) specParts.push(`D${depth}mm`);

      return JSON.stringify({
        estimate: {
          furniture_type: furnitureType,
          furniture_label: furnitureLabels[furnitureType] || furnitureType,
          specification: specParts.join(" x "),
          material: materialLabels[material] || material,
          material_cost: materialCost,
          labor_cost: laborCost,
          delivery_cost: deliveryCost,
          quantity,
          subtotal,
          tax,
          total,
          currency: "KRW",
          note: "이 견적은 AI 추정치이며, 실측 후 정확한 견적이 제공됩니다. 현장 상황에 따라 추가 비용이 발생할 수 있습니다.",
        },
      });
    },
  },
  {
    name: "compare_materials",
    description: "동일 가구에 대해 여러 자재별 견적을 비교합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        furniture_type: {
          type: "string",
          description: "가구 유형",
        },
        width_mm: { type: "number", description: "너비 (mm)" },
        height_mm: { type: "number", description: "높이 (mm)" },
        materials: {
          type: "array",
          items: { type: "string" },
          description: "비교할 자재 목록 (예: [\"lpm\", \"pet\", \"solid_wood\"])",
        },
      },
      required: ["furniture_type", "width_mm", "height_mm", "materials"],
    },
    execute: async (input) => {
      const basePrices: Record<string, number> = {
        sink: 800000,
        built_in_closet: 1500000,
        shoe_cabinet: 500000,
        vanity: 700000,
        fridge_cabinet: 500000,
        storage: 600000,
      };

      const materialMultiplier: Record<string, number> = {
        lpm: 1.0, pb: 1.0, mdf: 1.15, hpm: 1.15,
        pet: 1.2, melamine: 1.1, high_gloss: 1.4,
        uv: 1.35, solid_wood: 2.2, ceramic: 3.0,
      };

      const materialLabels: Record<string, string> = {
        lpm: "LPM", pb: "PB", mdf: "MDF", hpm: "HPM",
        pet: "PET", melamine: "멜라민", high_gloss: "하이그로시",
        uv: "UV코팅", solid_wood: "원목", ceramic: "세라믹",
      };

      const furnitureType = input.furniture_type as string;
      const width = (input.width_mm as number) || 1000;
      const materials = (input.materials as string[]) || ["lpm", "pet", "solid_wood"];

      const basePrice = basePrices[furnitureType] || 600000;
      const sizeMultiplier = Math.max(0.7, width / 1000);

      const comparisons = materials.map((mat) => {
        const matMul = materialMultiplier[mat] || 1.0;
        const materialCost = Math.round(basePrice * sizeMultiplier * matMul);
        const laborCost = Math.round(materialCost * 0.25);
        const total = materialCost + laborCost + 50000;
        const tax = Math.round(total * 0.1);

        return {
          material: mat,
          material_label: materialLabels[mat] || mat,
          material_cost: materialCost,
          labor_cost: laborCost,
          delivery_cost: 50000,
          total_with_tax: total + tax,
        };
      });

      return JSON.stringify({
        furniture_type: furnitureType,
        comparisons,
        recommendation: "가성비를 원하시면 LPM/PET, 고급스러운 느낌을 원하시면 하이그로시/원목을 추천합니다.",
      });
    },
  },
  {
    name: "generate_quote_pdf",
    description: "프로젝트의 견적서를 PDF로 생성합니다. 프로젝트에 품목과 견적이 등록되어 있어야 합니다.",
    input_schema: {
      type: "object" as const,
      properties: {
        project_id: { type: "string", description: "프로젝트 ID" },
      },
      required: ["project_id"],
    },
    execute: async (input) => {
      return JSON.stringify({
        success: true,
        action: "open_pdf",
        message: "견적서 PDF가 준비되었습니다. 프로젝트 상세 페이지에서 PDF를 다운로드할 수 있습니다.",
        project_id: input.project_id,
      });
    },
  },
];
