import { OpenAIClient, createAIWithRole } from "./open-ai.client";
import { SALES_EXPERT_PROMPT } from "../prompts/sales-expert.prompt";
import { LEGAL_EXPERT_PROMPT } from "../prompts/legal-expert.prompt";
import { HR_EXPERT_PROMPT } from "../prompts/hr-expert.prompt";
import { LEADER_EXPERT_PROMPT } from "../prompts/leader-expert.prompt";

// Singleton instances for each expert
let salesExpertInstance: OpenAIClient | null = null;
let legalExpertInstance: OpenAIClient | null = null;
let hrExpertInstance: OpenAIClient | null = null;
let leaderExpertInstance: OpenAIClient | null = null;

export class AIExperts {
  static getLeaderExpert(): OpenAIClient {
    if (!leaderExpertInstance) {
      leaderExpertInstance = createAIWithRole({
        id: "leader-expert",
        systemPrompt: LEADER_EXPERT_PROMPT,
      });
    }
    return leaderExpertInstance;
  }

  static getSalesExpert(): OpenAIClient {
    if (!salesExpertInstance) {
      salesExpertInstance = createAIWithRole({
        id: "sales-expert",
        systemPrompt: SALES_EXPERT_PROMPT,
      });
    }
    return salesExpertInstance;
  }

  static getLegalExpert(): OpenAIClient {
    if (!legalExpertInstance) {
      legalExpertInstance = createAIWithRole({
        id: "legal-expert",
        systemPrompt: LEGAL_EXPERT_PROMPT,
      });
    }
    return legalExpertInstance;
  }

  static getHRExpert(): OpenAIClient {
    if (!hrExpertInstance) {
      hrExpertInstance = createAIWithRole({
        id: "hr-expert",
        systemPrompt: HR_EXPERT_PROMPT,
      });
    }
    return hrExpertInstance;
  }

  // Helper method to clear all instances (useful for testing or resetting state)
  static clearAllInstances(): void {
    salesExpertInstance = null;
    legalExpertInstance = null;
    hrExpertInstance = null;
    leaderExpertInstance = null;
  }
}
