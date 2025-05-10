import { z } from "zod";

export const startChatSchema = z.object({
  prompt: z.string().min(1),
});

export type StartChatRequest = z.infer<typeof startChatSchema>;
