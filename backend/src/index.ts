import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
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

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 10;

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
      case "ListChats": {
        // Parse pagination parameters
        const limit = event.queryStringParameters?.limit
          ? Math.min(parseInt(event.queryStringParameters.limit, 10), 50)
          : DEFAULT_PAGE_SIZE;

        let startKey: Record<string, any> | undefined;
        if (event.queryStringParameters?.nextToken) {
          try {
            startKey = JSON.parse(
              Buffer.from(event.queryStringParameters.nextToken, "base64").toString()
            );
          } catch (e) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: "Invalid pagination token" }),
            };
          }
        }

        // Scan DynamoDB for all chats with pagination
        const result = await docClient.send(
          new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Limit: limit,
            ExclusiveStartKey: startKey,
          })
        );

        // Prepare the next token if there are more items
        const nextToken = result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
          : undefined;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            items: (result.Items || []).map(item => ({
              id: item.ChatId,
              prompt: item.Prompt,
              createdAt: item.CreatedAt,
            })),
            nextToken,
          }),
        };
      }

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

      case "GetChat": {
        const chatId = event.pathParameters?.id;
        if (!chatId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Chat ID is required" }),
          };
        }

        // Get chat from DynamoDB
        const result = await docClient.send(
          new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE,
            KeyConditionExpression: "#chatId = :chatId",
            ExpressionAttributeNames: {
              "#chatId": "ChatId",
            },
            ExpressionAttributeValues: {
              ":chatId": chatId,
            },
            Limit: 1,
          })
        );

        if (!result.Items?.[0]) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Chat not found" }),
          };
        }

        const chat = result.Items[0];
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: chat.ChatId,
            prompt: chat.Prompt,
            createdAt: chat.CreatedAt,
          }),
        };
      }

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
