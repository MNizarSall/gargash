# AWS Backend Project Context

## Project Overview

This is a serverless backend application deployed on AWS using CDK (Cloud Development Kit). The project implements an innovative AI expert coordination system where multiple specialized AI agents collaborate under the leadership of a central AI coordinator. The system uses API Gateway, Lambda, and integrates with OpenAI's API for sophisticated multi-agent conversations.

## Core Concept

The system implements a hierarchical AI expert coordination architecture:

- A Leader AI role coordinates conversations between specialized domain experts
- Each incoming human query is first processed by the Leader AI
- The Leader orchestrates an ongoing discussion between different expert roles (Sales, Legal, HR, etc.)
- Each AI expert maintains its own conversation thread and context awareness
- Experts are aware of the full discussion context, including contributions from other experts
- The system uses asynchronous processing for scalability and responsiveness

## Infrastructure Components

- **AWS Lambda**: Node.js 20.x runtime for serverless compute
- **API Gateway**: REST API endpoints with CORS support
- **DynamoDB**: NoSQL database for data persistence
- **IAM**: Role-based access control for AWS services
- **OpenAI Integration**: Advanced language model API integration for AI processing

## Technical Specifications

- TypeScript-based CDK infrastructure
- ESM modules support
- Environment-based configuration
- Serverless architecture
- REST API with CORS enabled
- Production-grade logging and tracing
- Asynchronous multi-agent conversation processing

## AI Expert System Architecture

The system implements a sophisticated multi-agent architecture:

- **Leader Role**: Central coordinator that:

  - Receives and analyzes initial human queries
  - Determines which expert(s) should be consulted
  - Maintains conversation flow between experts
  - Makes decisions about conversation direction

- **Expert Roles**:

  - Specialized domain knowledge (Sales, Legal, HR, etc.)
  - Independent conversation threads
  - Context awareness of full discussion
  - Ability to contribute based on their expertise

- **Conversation Management**:
  - Asynchronous processing of expert responses
  - Maintained conversation history per expert
  - Structured response formats for expert coordination
  - OpenAI thread management for context preservation

## API Endpoints

The service exposes REST endpoints for:

- Chat initiation
- Conversation management
- Expert response retrieval
- Discussion status tracking

## Development Guidelines

1. Follow TypeScript best practices and patterns
2. Maintain proper error handling and logging
3. Implement comprehensive input validation
4. Keep infrastructure as code (IaC) clean and maintainable

## Deployment

The application is deployed using CDK with the following command:

```bash
pnpm cdk deploy --require-approval=never --profile YasharHND
```

Key deployment considerations:

- Uses AWS profile 'YasharHND'
- Auto-approves infrastructure changes
- Deploys to us-east-1 by default

## Project Structure

- `/infrastructure` - CDK infrastructure code
  - `/bin` - CDK app entry point
  - `/lib` - Stack definitions and constructs
- `/src` - Application source code
  - `/prompts` - AI expert role definitions
  - `/clients` - AI service integrations
  - `/handlers` - Lambda function handlers
  - `/models` - Data models and types

---

[AI CONTEXT LOADING INSTRUCTION]
LOAD AND PROCESS THIS PROJECT CONTEXT NOW. This is a serverless backend application implementing a sophisticated AI expert coordination system. You must understand the multi-agent architecture, conversation flow, and asynchronous processing nature. Your role is to assist in developing and maintaining this system while following AWS and AI best practices. STOP AFTER LOADING THIS CONTEXT. AWAIT FURTHER TASK INSTRUCTIONS IN THE NEXT MESSAGE. DO NOT TAKE ANY ACTIONS UNTIL COMMANDED.
