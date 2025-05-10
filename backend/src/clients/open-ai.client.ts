import OpenAI from "openai";
import { getRequiredEnvVar } from "../utils/env.utils";

export interface AIRole {
  id: string;
  systemPrompt: string;
}

export class OpenAIClient {
  private readonly client: OpenAI;
  private messageHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private readonly role?: AIRole;

  constructor(role?: AIRole) {
    const apiKey = getRequiredEnvVar("OPENAI_API_KEY");
    this.client = new OpenAI({
      apiKey,
    });
    this.role = role;

    // Initialize message history with system prompt if role is provided
    if (role?.systemPrompt) {
      this.messageHistory.push({
        role: "system",
        content: role.systemPrompt,
      });
    }
  }

  /**
   * Creates a new instance of OpenAIClient with a specific role
   * @param role The role configuration including system prompt
   * @returns A new OpenAIClient instance configured with the role
   */
  public static withRole(role: AIRole): OpenAIClient {
    return new OpenAIClient(role);
  }

  /**
   * Sends a message and returns the generated response while maintaining conversation history
   * @param message The input message to send
   * @returns The generated response text
   * @throws Error if the API call fails
   */
  async sendMessage(message: string): Promise<string> {
    try {
      // Add user message to history
      this.messageHistory.push({
        role: "user",
        content: message,
      });

      const completion = await this.client.chat.completions.create({
        messages: this.messageHistory,
        model: "gpt-3.5-turbo",
      });

      const response = completion.choices[0]?.message;

      if (response) {
        // Add assistant's response to history
        this.messageHistory.push({
          role: response.role,
          content: response.content || "",
        });
        return response.content || "";
      }

      throw new Error("No response generated");
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      throw new Error("Failed to generate response from OpenAI");
    }
  }

  /**
   * Clears the conversation history while maintaining the system prompt
   */
  public clearHistory(): void {
    this.messageHistory = this.role?.systemPrompt
      ? [{ role: "system", content: this.role.systemPrompt }]
      : [];
  }

  /**
   * Gets the current conversation history
   * @returns Array of messages in the conversation
   */
  public getHistory(): OpenAI.Chat.ChatCompletionMessageParam[] {
    return [...this.messageHistory];
  }

  /**
   * Gets the role ID if one is assigned
   * @returns The role ID or undefined if no role is assigned
   */
  public getRoleId(): string | undefined {
    return this.role?.id;
  }
}

// Export a factory function to create role-based instances
export const createAIWithRole = (role: AIRole) => OpenAIClient.withRole(role);
