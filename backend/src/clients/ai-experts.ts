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

export interface LeaderResponse {
  targetExpert: ExpertRole;
  message: string;
  discussionComplete?: boolean;
}

export interface SalesResponse {
  message: string;
}

export interface LegalResponse {
  message: string;
}

export interface HRResponse {
  message: string;
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
