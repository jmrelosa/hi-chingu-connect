import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  text: z.string().min(1).max(2000),
  direction: z.enum(["en-ko", "ko-en"]),
});

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
      system: `You are a professional translator. Translate the user's message from ${from} to ${to}. Output ONLY the translation, with no quotes, no explanations, no transliteration. Preserve tone, punctuation, and meaning. If the input is already in ${to}, still translate idiomatically into natural ${to}.`,
      prompt: data.text,
    });

    return { translation: text.trim() };
  });