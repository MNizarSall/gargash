import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
      },
      environment: {
        DYNAMODB_TABLE: "Gargash",
      },
    });

    // Grant DynamoDB permissions
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
        resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/Gargash`],
      })
    );

    // Create API Gateway
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

    // Create /api/chats resource
    const chats = api.root.addResource("api").addResource("chats");

    // GET /api/chats - List all chats
    chats.addMethod(
      "GET",
      new apigateway.LambdaIntegration(handler, {
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
  }
}
