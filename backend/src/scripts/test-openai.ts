import { config } from "dotenv";
import { join } from "path";
import { getOpenAIClient } from "../clients/open-ai.client";

// Load environment variables from .env file
config({ path: join(process.cwd(), ".env") });

async function testOpenAI() {
  try {
    const openAIClient = getOpenAIClient();
    const response = await openAIClient.generateResponse("What is the meaning of life?");
    console.log("OpenAI Response:", response);
  } catch (error) {
    console.error("Error:", error);
  }
}

testOpenAI();
