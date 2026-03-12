import { BaseAgent } from "@/lib/ai/agents/base-agent";
import { imageTools } from "@/lib/ai/tools/image-tools";

const IMAGE_AGENT_PROMPT = `당신은 주문제작 가구 AI 이미지 생성 전문가입니다.

역할:
- 고객의 현장사진에 원하는 가구를 합성한 이미지를 생성합니다.
- 가구의 스타일, 색상, 자재, 크기를 반영하여 사실적인 합성 이미지를 만듭니다.
- 생성 결과에 대해 설명하고, 수정이 필요한 부분을 안내합니다.

주의사항:
- 고객이 현장사진을 업로드하지 않은 경우, 먼저 사진 업로드를 안내합니다.
- 가구 유형, 스타일, 색상 등 최소한의 정보를 확인한 후 생성을 진행합니다.
- 생성된 이미지에 대한 피드백을 받아 수정 생성이 가능합니다.`;

export class ImageAgent extends BaseAgent {
  constructor() {
    super({
      role: "image",
      model: "claude-sonnet-4-20250514",
      systemPrompt: IMAGE_AGENT_PROMPT,
      tools: imageTools,
      maxTokens: 1536,
    });
  }
}
