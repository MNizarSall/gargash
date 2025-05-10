import OpenAI from "openai";
import { getRequiredEnvVar } from "../utils/env.utils";

export class OpenAIClient {
  private static instance: OpenAIClient;
  private readonly client: OpenAI;

  private constructor() {
    const apiKey = getRequiredEnvVar("OPENAI_API_KEY");
    this.client = new OpenAI({
      apiKey,
    });
  }

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  /**
   * Sends a prompt to OpenAI and returns the generated response
   * @param prompt The input prompt to send to OpenAI
   * @returns The generated response text
   * @throws Error if the API call fails
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-3.5-turbo",
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      // Log the error details for debugging
      console.error("OpenAI API call failed:", error);
      throw new Error("Failed to generate response from OpenAI");
    }
  }
}

// Export the getInstance method instead of a singleton instance
export const getOpenAIClient = () => OpenAIClient.getInstance();
