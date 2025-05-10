import OpenAI from "openai";
import { getRequiredEnvVar } from "../utils/env.utils";

export type Message = OpenAI.Chat.ChatCompletionMessageParam;
export type ChatCompletion = OpenAI.Chat.ChatCompletion;

export class OpenAIClient {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = getRequiredEnvVar("OPENAI_API_KEY");
    this.client = new OpenAI({
      apiKey,
    });
  }

  /**
   * Sends messages to OpenAI and returns the completion
   */
  async complete(messages: Message[]): Promise<ChatCompletion> {
    try {
      return await this.client.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo",
      });
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      throw new Error("Failed to generate response from OpenAI");
    }
  }
}

// Lazy singleton creation
let instance: OpenAIClient | null = null;

export const openAIClient = {
  get instance() {
    if (!instance) {
      instance = new OpenAIClient();
    }
    return instance;
  },
};
