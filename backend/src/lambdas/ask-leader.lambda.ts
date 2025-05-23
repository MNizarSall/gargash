import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { AIExperts, ExpertRole, NonLeaderExpertRole } from "../clients/ai-experts";
import { Chat } from "../models/chat.model";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface Event {
  chatId: string;
  createdAt: number;
  prompt: string;
  currentTurn: number;
  maxTurns?: number;
}

export const handler = async (event: Event) => {
  const maxTurns = event.maxTurns || 10;

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
    availableExperts: result.Item.AvailableExperts,
    discussion: result.Item.Discussion || [],
    conclusion: result.Item.Conclusion,
  };

  // Format discussion history for the leader
  const history =
    chat.discussion?.map(msg => {
      const rolePrefix =
        msg.role === "leader" && msg.targetExpert
          ? `[${msg.role} → ${msg.targetExpert}]`
          : `[${msg.role}]`;
      return `${rolePrefix}: ${msg.content}`;
    }) || [];

  // Ask leader for next steps or conclusion based on max turns
  const promptMessage =
    event.currentTurn === 0
      ? event.prompt
      : event.currentTurn >= maxTurns
        ? "We've reached the maximum number of turns. Based on the discussion above, please provide a final conclusion that summarizes the key points and recommendations."
        : "Based on the discussion above, what should be our next step?";

  const leaderResponse = await AIExperts.askLeader(
    [...history, promptMessage],
    chat.availableExperts as NonLeaderExpertRole[]
  );

  // Set discussionComplete to true if max turns reached
  leaderResponse.discussionComplete =
    event.currentTurn >= maxTurns ? true : (leaderResponse.discussionComplete ?? false);

  // Remove targetExpert if discussion is complete
  if (leaderResponse.discussionComplete) {
    const { targetExpert, ...responseWithoutTarget } = leaderResponse;
    return responseWithoutTarget;
  }

  return leaderResponse;
};
