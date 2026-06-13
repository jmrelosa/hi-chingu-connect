import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  text: z.string().min(1).max(2000),
  direction: z.enum(["en-ko", "ko-en"]),
  style: z.enum(["formal", "casual", "polite"]).default("polite"),
});

function systemPrompt(from: string, to: string, style: string): string {
  const base = `You are a professional translator. Translate the user's message from ${from} to ${to}. Output ONLY the translation, with no quotes, no explanations, no transliteration.`;
  switch (style) {
    case "formal":
      return `${base} Use formal written Korean (격식체). Preserve tone, punctuation, and meaning.`;
    case "casual":
      return `${base} Translate into casual, friendly Korean speech (반말) as if texting a close friend. Preserve tone, punctuation, and meaning.`;
    case "polite":
    default:
      return `${base} Translate into polite conversational Korean (존댓말) appropriate for speaking to strangers or elders. Preserve tone, punctuation, and meaning.`;
  }
}

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const [from, to] =
      data.direction === "en-ko" ? ["English", "Korean"] : ["Korean", "English"];

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: systemPrompt(from, to, data.style),
      prompt: data.text,
    });

    return { translation: text.trim() };
  });