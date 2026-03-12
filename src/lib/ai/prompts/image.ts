import type { FurnitureType } from "@/types";
import { FURNITURE_TYPE_LABELS } from "@/types";

interface ImagePromptParams {
  furnitureType: FurnitureType;
  style?: string;
  color?: string;
  material?: string;
  widthMm?: number;
  heightMm?: number;
  additionalNotes?: string;
}

export function buildFurnitureImagePrompt(params: ImagePromptParams): string {
  const label = FURNITURE_TYPE_LABELS[params.furnitureType];

  const specs: string[] = [];
  if (params.widthMm && params.heightMm) {
    specs.push(`${params.widthMm}mm x ${params.heightMm}mm 크기의`);
  }
  if (params.material) specs.push(`${params.material} 재질`);
  if (params.color) specs.push(`${params.color} 색상`);
  if (params.style) specs.push(`${params.style} 스타일`);

  const specStr = specs.length > 0 ? specs.join(" ") + " " : "";

  return `이 사진의 공간에 ${specStr}${label}을(를) 설치한 모습을 사실적으로 생성해주세요.
기존 공간의 조명, 그림자, 원근감과 자연스럽게 어울려야 합니다.
가구의 재질감과 디테일이 사실적으로 표현되어야 합니다.
${params.additionalNotes ? `추가 요청: ${params.additionalNotes}` : ""}`.trim();
}

export const IMAGE_SYSTEM_PROMPT = `당신은 인테리어 전문 AI입니다.
고객이 제공한 현장 사진에 주문 제작 가구가 설치된 모습을 사실적으로 합성합니다.
조명, 그림자, 원근감을 현장 사진과 일치시키고, 가구의 재질감을 사실적으로 표현하세요.`;
