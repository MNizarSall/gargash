import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { startChatSchema, startChatResponseSchema } from "../schemas/start-chat.schema";
import { ZodError } from "zod";
import { headers } from "../utils/http.utils";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
    throw error;
  }
};
