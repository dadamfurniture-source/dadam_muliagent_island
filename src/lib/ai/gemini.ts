import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export { genAI };

export async function generateFurnitureImage(
  sourceImageBase64: string,
  sourceMimeType: string,
  prompt: string,
) {
  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: sourceMimeType,
              data: sourceImageBase64,
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];

  const result: { text?: string; imageBase64?: string; mimeType?: string } = {};

  for (const part of parts) {
    if (part.text) {
      result.text = part.text;
    }
    if (part.inlineData) {
      result.imageBase64 = part.inlineData.data;
      result.mimeType = part.inlineData.mimeType;
    }
  }

  return result;
}
