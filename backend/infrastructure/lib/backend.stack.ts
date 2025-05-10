import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";
import { ExpertDiscussionStateMachine } from "./expert-discussion.statemachine";

interface BackendStackProps extends cdk.StackProps {
  openAiApiKey: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // Create Lambda function
    const handler = new nodejs.NodejsFunction(this, "BackendHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../../src/index.ts"),
      handler: "handler",
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
        format: nodejs.OutputFormat.ESM,
        mainFields: ["module", "main"],
        esbuildArgs: {
          "--platform": "node",
          "--conditions": "module,import,require",
        },
        nodeModules: ["openai"], // Bundle openai package
        externalModules: [
          "@aws-sdk/*", // Keep AWS SDK external
        ],
      },
      environment: {
        DYNAMODB_TABLE: "Gargash",
        OPENAI_API_KEY: props.openAiApiKey,
        NODE_OPTIONS: "--enable-source-maps",
      },
      // Increase memory and timeout
      memorySize: 256,
      timeout: Duration.seconds(30),
    });

    // Create Expert Discussion State Machine
    const expertDiscussion = new ExpertDiscussionStateMachine(this, "ExpertDiscussion", {
      tableName: "Gargash",
      openAiApiKey: props.openAiApiKey,
    });

    // Grant DynamoDB permissions
    const dynamoPermissions = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
      ],
      resources: [
        `arn:aws:dynamodb:${this.region}:${this.account}:table/Gargash`,
        `arn:aws:dynamodb:${this.region}:${this.account}:table/Gargash/index/*`,
      ],
    });

    // Add permissions to handler Lambda
    handler.addToRolePolicy(dynamoPermissions);

    // Add permissions to start state machine execution
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["states:StartExecution"],
        resources: [expertDiscussion.stateMachine.stateMachineArn],
      })
    );

    // Add environment variable for state machine ARN
    handler.addEnvironment(
      "EXPERT_DISCUSSION_STATE_MACHINE_ARN",
      expertDiscussion.stateMachine.stateMachineArn
    );

    // Create API Gateway with increased timeout
    const api = new apigateway.RestApi(this, "BackendApi", {
      restApiName: "Backend Service",
      description: "Backend service API Gateway",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
      deployOptions: {
        stageName: "prod",
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
    });

    // Configure API Gateway timeout
    const integrationOptions: apigateway.IntegrationOptions = {
      timeout: Duration.seconds(29), // Should be slightly less than Lambda timeout
    };

    // Create /api/chats resource
    const chats = api.root.addResource("api").addResource("chats");

    // GET /api/chats - List all chats
    chats.addMethod(
      "GET",
      new apigateway.LambdaIntegration(handler, {
        ...integrationOptions,
        requestTemplates: {
          "application/json": JSON.stringify({
            operationName: "ListChats",
          }),
        },
      }),
      {
        authorizationType: apigateway.AuthorizationType.NONE,
        operationName: "ListChats",
      }
    );

    // POST /api/chats - Create new chat
    chats.addMethod(
      "POST",
      new apigateway.LambdaIntegration(handler, {
        ...integrationOptions,
        requestTemplates: {
          "application/json": JSON.stringify({
            operationName: "CreateChat",
          }),
        },
      }),
      {
        authorizationType: apigateway.AuthorizationType.NONE,
        operationName: "CreateChat",
      }
    );

    // GET /api/chats/{id} - Get specific chat
    const chat = chats.addResource("{id}");
    chat.addMethod(
      "GET",
      new apigateway.LambdaIntegration(handler, {
        ...integrationOptions,
        requestTemplates: {
          "application/json": JSON.stringify({
            operationName: "GetChat",
          }),
        },
      }),
      {
        authorizationType: apigateway.AuthorizationType.NONE,
        operationName: "GetChat",
      }
    );

    // Output the API Gateway URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway endpoint URL",
    });

    // Add State Machine ARN to outputs
    new cdk.CfnOutput(this, "StateMachineArn", {
      value: expertDiscussion.stateMachine.stateMachineArn,
      description: "Expert Discussion State Machine ARN",
    });
  }
}
