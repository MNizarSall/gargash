import { openAIClient, Message } from "./open-ai.client";
import { SALES_EXPERT_PROMPT } from "../prompts/sales-expert.prompt";
import { LEGAL_EXPERT_PROMPT } from "../prompts/legal-expert.prompt";
import { HR_EXPERT_PROMPT } from "../prompts/hr-expert.prompt";
import { createLeaderExpertPrompt } from "../prompts/leader-expert.prompt";
import { HR_OPS_ADMIN_EXPERT_PROMPT } from "../prompts/hr-ops-admin-expert.prompt";
import { PAYROLL_BENEFITS_EXPERT_PROMPT } from "../prompts/payroll-benefits-expert.prompt";
import { RECRUITMENT_SPECIALIST_PROMPT } from "../prompts/recruitment-specialist.prompt";

export enum ExpertRole {
  LEADER = "leader",
  SALES = "sales",
  LEGAL = "legal",
  HR = "hr",
  HR_OPS_ADMIN = "hr_ops_admin",
  PAYROLL_BENEFITS = "payroll_benefits",
  RECRUITMENT = "recruitment",
}

export interface ExpertResponse {
  message: string;
}

export interface LeaderResponse extends ExpertResponse {
  targetExpert: ExpertRole;
  discussionComplete?: boolean;
}

export type NonLeaderExpertRole = Exclude<ExpertRole, ExpertRole.LEADER>;

// Mapping of expert prompts (excluding leader which is handled separately)
const EXPERT_PROMPTS: Record<NonLeaderExpertRole, string> = {
  [ExpertRole.SALES]: SALES_EXPERT_PROMPT,
  [ExpertRole.LEGAL]: LEGAL_EXPERT_PROMPT,
  [ExpertRole.HR]: HR_EXPERT_PROMPT,
  [ExpertRole.HR_OPS_ADMIN]: HR_OPS_ADMIN_EXPERT_PROMPT,
  [ExpertRole.PAYROLL_BENEFITS]: PAYROLL_BENEFITS_EXPERT_PROMPT,
  [ExpertRole.RECRUITMENT]: RECRUITMENT_SPECIALIST_PROMPT,
};

export class AIExperts {
  private static createMessages(systemPrompt: string, userMessages: string[]): Message[] {
    return [
      { role: "system" as const, content: systemPrompt },
      ...userMessages.map(msg => ({ role: "user" as const, content: msg })),
    ];
  }

  static async askLeader(
    messages: string[],
    availableExperts: NonLeaderExpertRole[]
  ): Promise<LeaderResponse> {
    // Create dynamic leader prompt with provided available experts
    const leaderPrompt = createLeaderExpertPrompt(availableExperts);
    const completion = await openAIClient.instance.complete(
      this.createMessages(leaderPrompt, messages)
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from leader");

    const response = JSON.parse(content) as LeaderResponse;

    // Validate that the leader only chose from available experts
    if (!availableExperts.includes(response.targetExpert as NonLeaderExpertRole)) {
      throw new Error(`Leader chose unavailable expert: ${response.targetExpert}`);
    }

    return response;
  }

  static async askExpert(role: NonLeaderExpertRole, messages: string[]): Promise<ExpertResponse> {
    const prompt = EXPERT_PROMPTS[role];
    if (!prompt) {
      throw new Error(`Invalid expert role: ${role}`);
    }

    const completion = await openAIClient.instance.complete(this.createMessages(prompt, messages));

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error(`No response from ${role} expert`);

    return JSON.parse(content);
  }
}
