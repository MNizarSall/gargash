import { config } from "dotenv";
import { join } from "path";
import { AIExperts } from "../clients/ai-experts";

// Load environment variables from .env file
config({ path: join(process.cwd(), ".env") });

async function testLeaderExpert() {
  try {
    console.log("Sending query to Leader Expert...\n");

    const response = await AIExperts.askLeader([
      "I need help improving our company's sales process. Can you help?",
    ]);

    console.log("Leader Response:");
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

// Run the test
testLeaderExpert();
