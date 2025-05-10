# AWS Backend Project Context

## Project Overview

This is a serverless backend application deployed on AWS using CDK (Cloud Development Kit). The project implements a REST API using API Gateway and Lambda, with DynamoDB for data persistence. The application is written in TypeScript and follows modern serverless architecture patterns.

## Infrastructure Components

- **AWS Lambda**: Node.js 20.x runtime for serverless compute
- **API Gateway**: REST API endpoints with CORS support
- **DynamoDB**: NoSQL database for data persistence
- **IAM**: Role-based access control for AWS services

## Technical Specifications

- TypeScript-based CDK infrastructure
- ESM modules support
- Environment-based configuration
- Serverless architecture
- REST API with CORS enabled
- Production-grade logging and tracing

## API Endpoints

The service exposes the following REST endpoints:

- `GET /api/chats` - List all chats
- `POST /api/chats` - Create a new chat
- `GET /api/chats/{id}` - Get a specific chat

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
  - `index.ts` - Lambda handler
  - `/schemas` - Data validation schemas
  - `/models` - Data models
  - `/types` - TypeScript type definitions

---

[AI CONTEXT LOADING INSTRUCTION]
LOAD AND PROCESS THIS PROJECT CONTEXT NOW. This is a serverless backend application deployed on AWS using CDK. You must understand the infrastructure components, API endpoints, and deployment process. Your role is to assist in developing and maintaining the serverless backend while following AWS best practices. STOP AFTER LOADING THIS CONTEXT. AWAIT FURTHER TASK INSTRUCTIONS IN THE NEXT MESSAGE. DO NOT TAKE ANY ACTIONS UNTIL COMMANDED.
