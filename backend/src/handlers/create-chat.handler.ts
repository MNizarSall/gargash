import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { v4 as uuidv4 } from "uuid";
import { startChatSchema } from "../schemas/start-chat.schema";
import { ZodError } from "zod";
import { headers } from "../utils/http.utils";
import { Chat, DiscussionStatus } from "../models/chat.model";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const sfnClient = new SFNClient({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse and validate request body
    const body = JSON.parse(event.body || "{}");
    const validatedData = startChatSchema.parse(body);

    const chatId = uuidv4();
    const timestamp = Date.now();

    const chat: Chat = {
      id: chatId,
      prompt: validatedData.prompt,
      createdAt: timestamp,
      status: DiscussionStatus.STARTED,
      availableExperts: validatedData.availableExperts,
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
          Status: DiscussionStatus.STARTED,
          AvailableExperts: validatedData.availableExperts,
        },
      })
    );

    // Start the state machine execution
    await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: process.env.EXPERT_DISCUSSION_STATE_MACHINE_ARN,
        input: JSON.stringify({
          chatId,
          createdAt: timestamp,
          prompt: validatedData.prompt,
          currentTurn: 0,
          maxTurns: 10,
          availableExperts: validatedData.availableExperts,
        }),
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
