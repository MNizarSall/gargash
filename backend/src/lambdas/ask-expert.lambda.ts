import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { AIExperts, ExpertRole } from "../clients/ai-experts";
import { Chat } from "../models/chat.model";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface Event {
  chatId: string;
  createdAt: number;
  leaderResponse: {
    targetExpert: ExpertRole;
    message: string;
    discussionComplete: boolean;
  };
}

export const handler = async (event: Event) => {
  // Get current chat state
  const result = await docClient.send(
    new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        ChatId: event.chatId,
        CreatedAt: event.createdAt,
      },
    })
  );

  if (!result.Item) {
    throw new Error("Chat not found");
  }

  const chat: Chat = {
    id: result.Item.ChatId,
    prompt: result.Item.Prompt,
    createdAt: result.Item.CreatedAt,
    status: result.Item.Status,
    discussion: result.Item.Discussion || [],
    conclusion: result.Item.Conclusion,
  };

  // Format discussion history for the expert
  const history =
    chat.discussion?.map(msg => {
      const rolePrefix =
        msg.role === "leader" && msg.targetExpert
          ? `[LEADER → ${msg.targetExpert.toUpperCase()}]`
          : `[${msg.role.toUpperCase()}]`;
      return `${rolePrefix}: ${msg.content}`;
    }) || [];

  // Ask the targeted expert
  let expertResponse;
  switch (event.leaderResponse.targetExpert) {
    case ExpertRole.SALES:
      expertResponse = await AIExperts.askSales([...history, event.leaderResponse.message]);
      break;
    case ExpertRole.LEGAL:
      expertResponse = await AIExperts.askLegal([...history, event.leaderResponse.message]);
      break;
    case ExpertRole.HR:
      expertResponse = await AIExperts.askHR([...history, event.leaderResponse.message]);
      break;
    default:
      throw new Error(`Unknown expert role: ${event.leaderResponse.targetExpert}`);
  }

  return expertResponse;
};
