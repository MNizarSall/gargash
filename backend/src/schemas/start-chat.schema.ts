import { z } from "zod";
import { ExpertRole } from "../clients/ai-experts";

const NonLeaderExpertRoles = [
  ExpertRole.SALES,
  ExpertRole.LEGAL,
  ExpertRole.HR,
  ExpertRole.HR_OPS_ADMIN,
  ExpertRole.PAYROLL_BENEFITS,
  ExpertRole.RECRUITMENT,
] as const;

export const startChatSchema = z.object({
  prompt: z.string().min(1),
  availableExperts: z.array(z.enum(NonLeaderExpertRoles)).min(1),
});

export type StartChatRequest = z.infer<typeof startChatSchema>;
