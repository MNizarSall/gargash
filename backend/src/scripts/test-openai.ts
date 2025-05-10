import { config } from "dotenv";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import {
  AIExperts,
  ExpertRole,
  LeaderResponse,
  SalesResponse,
  LegalResponse,
  HRResponse,
} from "../clients/ai-experts";
import { Chat, Message, DiscussionStatus } from "../models/chat.model";
import { fromIni } from "@aws-sdk/credential-providers";

// Load environment variables from .env file
config({ path: join(process.cwd(), ".env") });

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: "me-central-1",
  credentials: fromIni({ profile: "YasharHND" }),
});
const docClient = DynamoDBDocumentClient.from(client);

type ExpertResponse = LeaderResponse | SalesResponse | LegalResponse | HRResponse;

// Format conversation history for the next message
const formatHistoryForPrompt = (history: Message[]): string[] => {
  return history.map(msg => {
    const rolePrefix =
      msg.role === ExpertRole.LEADER && msg.targetExpert
        ? `[${msg.role.toUpperCase()} → ${msg.targetExpert.toUpperCase()}]`
        : `[${msg.role.toUpperCase()}]`;
    return `${rolePrefix}: ${msg.content}`;
  });
};

async function saveChat(chat: Chat): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: "Gargash",
      Item: {
        ChatId: chat.id,
        CreatedAt: chat.createdAt,
        Prompt: chat.prompt,
        Type: "CHAT",
        Status: chat.status,
        Discussion: chat.discussion || [],
        Conclusion: chat.conclusion,
      },
    })
  );
}

async function getChat(chatId: string, createdAt: number): Promise<Chat | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: "Gargash",
      Key: {
        ChatId: chatId,
        CreatedAt: createdAt,
      },
    })
  );

  if (!result.Item) return null;

  return {
    id: result.Item.ChatId,
    prompt: result.Item.Prompt,
    createdAt: result.Item.CreatedAt,
    status: result.Item.Status,
    discussion: result.Item.Discussion || [],
    conclusion: result.Item.Conclusion,
  };
}

async function conductExpertDiscussion(initialQuery: string, maxTurns: number = 10) {
  // Create initial chat entry
  const chatId = uuidv4();
  const createdAt = Date.now(); // Store the timestamp
  const initialChat: Chat = {
    id: chatId,
    prompt: initialQuery,
    createdAt, // Use the stored timestamp
    status: DiscussionStatus.STARTED,
    discussion: [],
  };
  await saveChat(initialChat);

  console.log("Starting expert discussion...\n");
  console.log(`Initial Query: "${initialQuery}"\n`);

  let currentTurn = 0;
  let isDiscussionComplete = false;

  try {
    while (!isDiscussionComplete && currentTurn < maxTurns) {
      currentTurn++;
      console.log(`\n=== Turn ${currentTurn} ===\n`);

      // Get current chat state
      const chat = await getChat(chatId, createdAt); // Pass the timestamp
      if (!chat) throw new Error("Chat not found");

      // Ask leader for next steps
      const leaderResponse = await AIExperts.askLeader([
        ...formatHistoryForPrompt(chat.discussion || []),
        currentTurn === 1
          ? initialQuery
          : "Based on the discussion above, what should be our next step?",
      ]);

      // Add leader's message to discussion
      const leaderMessage: Message = {
        role: ExpertRole.LEADER,
        content: leaderResponse.message,
        targetExpert: leaderResponse.targetExpert,
      };
      chat.discussion = [...(chat.discussion || []), leaderMessage];
      chat.status = DiscussionStatus.CONTINUES;
      await saveChat(chat);

      console.log(
        `Leader → ${leaderResponse.targetExpert.toUpperCase()}: ${leaderResponse.message}`
      );

      // Consult the targeted expert
      const expertMessages = [...formatHistoryForPrompt(chat.discussion), leaderResponse.message];

      let expertResponse: ExpertResponse;
      switch (leaderResponse.targetExpert) {
        case ExpertRole.SALES:
          expertResponse = await AIExperts.askSales(expertMessages);
          break;
        case ExpertRole.LEGAL:
          expertResponse = await AIExperts.askLegal(expertMessages);
          break;
        case ExpertRole.HR:
          expertResponse = await AIExperts.askHR(expertMessages);
          break;
        default:
          throw new Error(`Unknown expert role: ${leaderResponse.targetExpert}`);
      }

      // Add expert's message to discussion
      const expertMessage: Message = {
        role: leaderResponse.targetExpert,
        content: expertResponse.message,
      };
      chat.discussion = [...chat.discussion, expertMessage];
      await saveChat(chat);

      console.log(`${leaderResponse.targetExpert.toUpperCase()}: ${expertResponse.message}`);

      // Check if discussion is complete after getting expert's response
      if (leaderResponse.discussionComplete) {
        console.log("\nLeader has indicated this will be the final round.");
        isDiscussionComplete = true;
      }
    }

    if (currentTurn >= maxTurns) {
      console.log("\nReached maximum number of turns. Discussion ended.");
    }

    // Get final conclusion from the leader
    console.log("\n=== Final Conclusion ===\n");
    const chat = await getChat(chatId, createdAt);
    if (!chat) throw new Error("Chat not found");

    const finalLeaderResponse = await AIExperts.askLeader([
      ...formatHistoryForPrompt(chat.discussion || []),
      "Please provide a final conclusion summarizing the discussion and key recommendations.",
    ]);

    // Add conclusion to chat
    chat.conclusion = finalLeaderResponse.message;
    chat.status = DiscussionStatus.CONCLUDED;
    await saveChat(chat);

    console.log(`Leader's Conclusion: ${finalLeaderResponse.message}`);

    // Print final summary
    console.log("\nFinal Conversation Summary:");
    chat.discussion?.forEach(msg => {
      const rolePrefix =
        msg.role === ExpertRole.LEADER && msg.targetExpert
          ? `[${msg.role.toUpperCase()} → ${msg.targetExpert.toUpperCase()}]`
          : `[${msg.role.toUpperCase()}]`;
      console.log(`\n${rolePrefix}: ${msg.content}`);
    });
    console.log("\nConclusion:", chat.conclusion);
  } catch (error) {
    console.error("Error during discussion:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

// Run the test with an initial query
conductExpertDiscussion(
  "I need help improving our company's sales process while ensuring legal compliance and maintaining employee satisfaction. Can you help?"
);
