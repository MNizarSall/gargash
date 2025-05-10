import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { startChatSchema } from "../schemas/start-chat.schema";
import { ZodError } from "zod";
import { headers } from "../utils/http.utils";
import { createAIWithRole } from "../clients/open-ai.client";
import { Message, Chat } from "../models/chat.model";
import { SALES_EXPERT_PROMPT } from "../prompts/sales-expert";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Initialize Sales Expert AI
const salesExpert = createAIWithRole({
  id: "sales-expert",
  systemPrompt: SALES_EXPERT_PROMPT,
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || "{}");
    const validatedData = startChatSchema.parse(body);

    const chatId = uuidv4();
    const timestamp = Date.now();

    // Get response from Sales Expert AI
    const aiResponse = await salesExpert.sendMessage(validatedData.prompt);

    // Create discussion array with only the AI response
    const discussion: Message[] = [
      {
        agentId: "sales-expert",
        message: aiResponse,
      },
    ];

    const chat: Chat = {
      id: chatId,
      prompt: validatedData.prompt,
      createdAt: timestamp,
      discussion,
    };

    // Create new chat in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          ChatId: chatId,
          CreatedAt: timestamp,
          Prompt: validatedData.prompt,
          Type: "CHAT",
          Discussion: discussion,
        },
      })
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(chat),
    };
  } catch (error) {
    console.error("Error in create chat handler:", error);

    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Validation Error",
          details: error.errors,
        }),
      };
    }
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Invalid JSON",
          message: "The request body is not valid JSON",
        }),
      };
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
    };
  }
};
