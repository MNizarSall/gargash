import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { handler as listChatsHandler } from "./handlers/list-chats.handler";
import { handler as createChatHandler } from "./handlers/create-chat.handler";
import { handler as getChatHandler } from "./handlers/get-chat.handler";
import { headers } from "./utils/http.utils";

/**
 * AWS Lambda handler for API Gateway requests
 * Delegates to specific handlers based on the operation
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Event:", JSON.stringify(event, null, 2));

    // @ts-expect-error operationName exists in API Gateway events but is not in the types
    switch (event.requestContext.operationName) {
      case "ListChats":
        return await listChatsHandler(event);
      case "CreateChat":
        return await createChatHandler(event);
      case "GetChat":
        return await getChatHandler(event);
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
