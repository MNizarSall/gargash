import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { Chat, DiscussionStatus, Message } from "../models/chat.model";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface Event {
  chatId: string;
  createdAt: number;
  leaderResponse: {
    targetExpert: string;
    message: string;
    discussionComplete: boolean;
  };
  expertResponse?: {
    message: string;
  };
  currentTurn: number;
  maxTurns: number;
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
    availableExperts: result.Item.AvailableExperts,
    discussion: result.Item.Discussion || [],
    conclusion: result.Item.Conclusion,
  };

  // Add leader's message to discussion
  const leaderMessage: Message = {
    role: "leader",
    content: event.leaderResponse.message,
    targetExpert: event.leaderResponse.targetExpert,
  };
  const discussion = [...(chat.discussion || []), leaderMessage];

  // Add expert's message if available
  if (event.expertResponse) {
    const expertMessage: Message = {
      role: event.leaderResponse.targetExpert,
      content: event.expertResponse.message,
    };
    discussion.push(expertMessage);
  }

  // Update status and conclusion if discussion is complete
  const status = event.leaderResponse.discussionComplete
    ? DiscussionStatus.CONCLUDED
    : DiscussionStatus.CONTINUES;

  const conclusion = event.leaderResponse.discussionComplete
    ? event.leaderResponse.message
    : undefined;

  // Save updated chat
  await docClient.send(
    new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        ChatId: chat.id,
        CreatedAt: chat.createdAt,
        Prompt: chat.prompt,
        Type: "CHAT",
        Status: status,
        AvailableExperts: chat.availableExperts,
        Discussion: discussion,
        Conclusion: conclusion,
      },
    })
  );

  // Return only the data needed for the next state
  return {
    chatId: chat.id,
    createdAt: chat.createdAt,
    prompt: chat.prompt,
    currentTurn: event.currentTurn,
    maxTurns: event.maxTurns,
    leaderResponse: event.leaderResponse,
    expertResponse: event.expertResponse,
  };
};
