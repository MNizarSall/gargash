import { config } from "dotenv";
import { join } from "path";
import { createAIWithRole, AIRole } from "../clients/open-ai.client";
import { readFileSync } from "fs";

// Load environment variables from .env file
config({ path: join(process.cwd(), ".env") });

async function loadRolePrompt(roleName: string): Promise<string> {
  return readFileSync(join(process.cwd(), `src/prompts/${roleName}.prompt.md`), "utf-8");
}

async function testMultipleAIRoles() {
  try {
    // Load the sales expert prompt
    const salesExpertPrompt = await loadRolePrompt("sales-expert");

    // Create the Sales Expert AI instance
    const salesExpert = createAIWithRole({
      id: "sales-expert",
      systemPrompt: salesExpertPrompt,
    });

    // Test the Sales Expert with a specific scenario
    console.log("\n=== Testing Sales Expert AI ===\n");

    const salesQuestion =
      "We're a B2B SaaS company. What are the key metrics we should track for our sales performance?";
    console.log("Question:", salesQuestion);

    const salesResponse = await salesExpert.sendMessage(salesQuestion);
    console.log("\nSales Expert Response:", salesResponse);

    // Test follow-up question to demonstrate conversation memory
    const followUpQuestion =
      "Can you elaborate on the customer acquisition cost metric specifically?";
    console.log("\nFollow-up Question:", followUpQuestion);

    const followUpResponse = await salesExpert.sendMessage(followUpQuestion);
    console.log("\nSales Expert Response:", followUpResponse);

    // Display conversation history
    console.log("\n=== Conversation History ===\n");
    console.log(salesExpert.getHistory());
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

testMultipleAIRoles();
