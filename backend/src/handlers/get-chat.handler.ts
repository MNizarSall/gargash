import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { headers } from "../utils/http.utils";
import { Chat } from "../models/chat.model";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

  const item = result.Items[0];
  const chat: Chat = {
    id: item.ChatId,
    prompt: item.Prompt,
    createdAt: item.CreatedAt,
    discussion: item.Discussion || [],
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(chat),
  };
};
