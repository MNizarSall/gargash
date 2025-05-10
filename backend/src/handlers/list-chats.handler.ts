import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
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

  try {
    // Query DynamoDB using the CreatedAt-index in descending order
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE,
        IndexName: "CreatedAtIndex",
        KeyConditionExpression: "#type = :type",
        ExpressionAttributeNames: {
          "#type": "Type",
          "#createdAt": "CreatedAt",
          "#chatId": "ChatId",
          "#prompt": "Prompt",
          "#status": "Status",
        },
        ExpressionAttributeValues: {
          ":type": "CHAT",
        },
        ProjectionExpression: "#chatId, #type, #createdAt, #prompt, #status",
        ScanIndexForward: false, // This makes it DESC order
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
          status: item.Status,
        })),
        nextToken,
      }),
    };
  } catch (error) {
    console.error("DynamoDB Query Error:", error);
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
