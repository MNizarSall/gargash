import { config } from "dotenv";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { AIExperts, ExpertRole, NonLeaderExpertRole } from "../clients/ai-experts";
import { Chat, Message, DiscussionStatus } from "../models/chat.model";
import { fromIni } from "@aws-sdk/credential-providers";

// Load environment variables from .env file
config({ path: join(process.cwd(), ".env") });

// Define available HR experts
const HR_EXPERTS: NonLeaderExpertRole[] = [
  ExpertRole.HR_OPS_ADMIN,
  ExpertRole.PAYROLL_BENEFITS,
  ExpertRole.RECRUITMENT,
];

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: "me-central-1",
  credentials: fromIni({ profile: "YasharHND" }),
});
const docClient = DynamoDBDocumentClient.from(client);

// Format conversation history for the next message
const formatHistoryForPrompt = (history: Message[]): string[] => {
  return history.map(msg => {
    const rolePrefix =
      msg.role === ExpertRole.LEADER && msg.targetExpert
        ? `[${msg.role} → ${msg.targetExpert}]`
        : `[${msg.role}]`;
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
        AvailableExperts: chat.availableExperts,
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
    availableExperts: result.Item.AvailableExperts || HR_EXPERTS,
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
    availableExperts: HR_EXPERTS,
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
      const chat = await getChat(chatId, createdAt);
      if (!chat) throw new Error("Chat not found");

      // Ask leader for next steps
      const leaderResponse = await AIExperts.askLeader(
        [
          ...formatHistoryForPrompt(chat.discussion || []),
          currentTurn === 1
            ? initialQuery
            : "Based on the discussion above, what should be our next step?",
        ],
        HR_EXPERTS
      );

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
        `${ExpertRole.LEADER} → ${leaderResponse.targetExpert}: ${leaderResponse.message}`
      );

      // Validate expert role
      if (leaderResponse.targetExpert === ExpertRole.LEADER) {
        throw new Error("Leader cannot be targeted as an expert");
      }

      // Consult the targeted expert using the dynamic method
      const expertMessages = [...formatHistoryForPrompt(chat.discussion), leaderResponse.message];
      const expertResponse = await AIExperts.askExpert(leaderResponse.targetExpert, expertMessages);

      // Add expert's message to discussion
      const expertMessage: Message = {
        role: leaderResponse.targetExpert,
        content: expertResponse.message,
      };
      chat.discussion = [...chat.discussion, expertMessage];
      await saveChat(chat);

      console.log(`${leaderResponse.targetExpert}: ${expertResponse.message}`);

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

    const finalLeaderResponse = await AIExperts.askLeader(
      [
        ...formatHistoryForPrompt(chat.discussion || []),
        "Please provide a final conclusion summarizing the discussion and key recommendations.",
      ],
      HR_EXPERTS
    );

    // Add conclusion to chat
    chat.conclusion = finalLeaderResponse.message;
    chat.status = DiscussionStatus.CONCLUDED;
    await saveChat(chat);

    console.log(`${ExpertRole.LEADER}'s Conclusion: ${finalLeaderResponse.message}`);

    // Print final summary
    console.log("\nFinal Conversation Summary:");
    chat.discussion?.forEach(msg => {
      const rolePrefix =
        msg.role === ExpertRole.LEADER && msg.targetExpert
          ? `[${msg.role} → ${msg.targetExpert}]`
          : `[${msg.role}]`;
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

// Run the test with an HR-focused initial query
conductExpertDiscussion(
  "We need to establish a new HR department for our luxury car dealership expansion in Dubai. We need to: 1. Set up HR operations and administrative systems 2. Design competitive compensation and benefits packages 3. Create a recruitment strategy for local talent. Please provide comprehensive recommendations for each area."
);
