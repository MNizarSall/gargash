import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { headers } from "../utils/http.utils";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const DEFAULT_PAGE_SIZE = 10;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
};
