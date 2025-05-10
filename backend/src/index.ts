import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * AWS Lambda handler for API Gateway requests
 * @param event - The API Gateway event
 * @param context - The Lambda context
 * @returns Promise<APIGatewayProxyResult> - The API response
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Log the incoming request (useful for debugging)
    console.log("Event:", JSON.stringify(event, null, 2));

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case "GET":
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            // Enable CORS
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
          },
          body: JSON.stringify({
            message: "Hello from Lambda!",
            timestamp: new Date().toISOString(),
          }),
        };

      default:
        return {
          statusCode: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            error: `Method ${event.httpMethod} not allowed`,
          }),
        };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      }),
    };
  }
};
