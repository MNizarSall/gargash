import { openAIClient, Message } from "./open-ai.client";
import { SALES_EXPERT_PROMPT } from "../prompts/sales-expert.prompt";
import { LEGAL_EXPERT_PROMPT } from "../prompts/legal-expert.prompt";
import { HR_EXPERT_PROMPT } from "../prompts/hr-expert.prompt";
import { LEADER_EXPERT_PROMPT } from "../prompts/leader-expert.prompt";

export enum ExpertRole {
  LEADER = "leader",
  SALES = "sales",
  LEGAL = "legal",
  HR = "hr",
}

interface LeaderResponse {
  targetExpert: ExpertRole;
  query: string;
  context?: Record<string, unknown>;
}

interface SalesResponse {
  recommendation: string;
  metrics?: string[];
  nextSteps?: string[];
}

interface LegalResponse {
  advice: string;
  risks?: string[];
  requirements?: string[];
}

interface HRResponse {
  guidance: string;
  policies?: string[];
  bestPractices?: string[];
}

export class AIExperts {
  private static createMessages(systemPrompt: string, userMessages: string[]): Message[] {
    return [
      { role: "system" as const, content: systemPrompt },
      ...userMessages.map(msg => ({ role: "user" as const, content: msg })),
    ];
  }

  static async askLeader(messages: string[]): Promise<LeaderResponse> {
    const completion = await openAIClient.instance.complete(
      this.createMessages(LEADER_EXPERT_PROMPT, messages)
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from leader");

    return JSON.parse(content);
  }

  static async askSales(messages: string[]): Promise<SalesResponse> {
    const completion = await openAIClient.instance.complete(
      this.createMessages(SALES_EXPERT_PROMPT, messages)
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from sales expert");

    return JSON.parse(content);
  }

  static async askLegal(messages: string[]): Promise<LegalResponse> {
    const completion = await openAIClient.instance.complete(
      this.createMessages(LEGAL_EXPERT_PROMPT, messages)
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from legal expert");

    return JSON.parse(content);
  }

  static async askHR(messages: string[]): Promise<HRResponse> {
    const completion = await openAIClient.instance.complete(
      this.createMessages(HR_EXPERT_PROMPT, messages)
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from HR expert");

    return JSON.parse(content);
  }
}
