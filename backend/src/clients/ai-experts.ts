import { openAIClient, Message } from "./open-ai.client";
import { SALES_EXPERT_PROMPT } from "../prompts/sales-expert.prompt";
import { LEGAL_EXPERT_PROMPT } from "../prompts/legal-expert.prompt";
import { HR_EXPERT_PROMPT } from "../prompts/hr-expert.prompt";
import { LEADER_EXPERT_PROMPT } from "../prompts/leader-expert.prompt";
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

const EXPERT_PROMPTS: Record<ExpertRole, string> = {
  [ExpertRole.LEADER]: LEADER_EXPERT_PROMPT,
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

  static async askLeader(messages: string[]): Promise<LeaderResponse> {
    const completion = await openAIClient.instance.complete(
      this.createMessages(EXPERT_PROMPTS[ExpertRole.LEADER], messages)
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from leader");

    return JSON.parse(content);
  }

  static async askExpert(
    role: Exclude<ExpertRole, ExpertRole.LEADER>,
    messages: string[]
  ): Promise<ExpertResponse> {
    if (!EXPERT_PROMPTS[role]) {
      throw new Error(`Invalid expert role: ${role}`);
    }

    const completion = await openAIClient.instance.complete(
      this.createMessages(EXPERT_PROMPTS[role], messages)
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error(`No response from ${role} expert`);

    return JSON.parse(content);
  }
}
