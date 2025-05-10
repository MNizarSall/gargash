import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
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
    });

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
        // Enable public access
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
    });

    // Create API Gateway resource and method
    const items = api.root.addResource("api");

    // Add GET method with 'NONE' authentication
    items.addMethod(
      "GET",
      new apigateway.LambdaIntegration(handler, {
        proxy: true,
        allowTestInvoke: true,
      }),
      {
        authorizationType: apigateway.AuthorizationType.NONE, // This makes it publicly accessible
      }
    );

    // Output the API Gateway URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway endpoint URL",
    });
  }
}
