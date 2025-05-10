import { z } from "zod";

export const startChatSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt cannot be empty")
    .max(1000, "Prompt is too long (max 1000 characters)"),
});

export type StartChatRequest = z.infer<typeof startChatSchema>;

export const startChatResponseSchema = z.object({
  id: z.string(),
});

export type StartChatResponse = z.infer<typeof startChatResponseSchema>;
