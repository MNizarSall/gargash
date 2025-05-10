import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Chat, mockChats } from "./models/chat.model";
import { startChatSchema, startChatResponseSchema } from "./schemas/start-chat.schema";
import { ZodError } from "zod";

// Initialize DynamoDB clients
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Common headers for all responses
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * AWS Lambda handler for API Gateway requests
 * @param event - The API Gateway event
 * @returns Promise<APIGatewayProxyResult> - The API response
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Event:", JSON.stringify(event, null, 2));

    // @ts-expect-error operationName exists in API Gateway events but is not in the types
    switch (event.requestContext.operationName) {
      case "ListChats":
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(
            mockChats.map(({ id, prompt }) => ({
              id,
              prompt,
            }))
          ),
        };

      case "CreateChat": {
        try {
          // Parse and validate request body
          const body = JSON.parse(event.body || "{}");
          const validatedData = startChatSchema.parse(body);

          const chatId = uuidv4();
          const timestamp = Date.now();

          // Create new chat in DynamoDB
          await docClient.send(
            new PutCommand({
              TableName: process.env.DYNAMODB_TABLE,
              Item: {
                ChatId: chatId,
                CreatedAt: timestamp,
                Prompt: validatedData.prompt,
              },
            })
          );

          // Validate response
          const response = startChatResponseSchema.parse({ id: chatId });

          return {
            statusCode: 201,
            headers,
            body: JSON.stringify(response),
          };
        } catch (error) {
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
          throw error; // Re-throw other errors to be caught by the outer try-catch
        }
      }

      case "GetChat":
        const chatId = event.pathParameters?.id;
        const chat = mockChats.find(c => c.id === chatId);

        if (!chat) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Chat not found" }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(chat),
        };

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: "Not found" }),
        };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }),
    };
  }
};
