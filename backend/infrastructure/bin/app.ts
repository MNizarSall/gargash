#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend.stack";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables from .env file
config({ path: join(__dirname, "../../.env") });

// Ensure required environment variables are present
const requiredEnvVars = ["OPENAI_API_KEY"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const app = new cdk.App();

new BackendStack(app, "BackendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
  description: "Backend service with Lambda and API Gateway",
  // Pass environment variables to the stack
  openAiApiKey: process.env.OPENAI_API_KEY!,
});
