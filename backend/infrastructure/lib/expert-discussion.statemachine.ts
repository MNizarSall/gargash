import * as cdk from "aws-cdk-lib";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface ExpertDiscussionStateMachineProps {
  tableName: string;
  openAiApiKey: string;
}

export class ExpertDiscussionStateMachine extends Construct {
  public readonly stateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: ExpertDiscussionStateMachineProps) {
    super(scope, id);

    // Create DynamoDB permissions
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
        `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:table/${props.tableName}`,
        `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:table/${props.tableName}/index/*`,
      ],
    });

    // Lambda functions for each step
    const askLeaderFunction = new nodejs.NodejsFunction(this, "AskLeaderFunction", {
      entry: "src/lambdas/ask-leader.lambda.ts",
      environment: {
        DYNAMODB_TABLE: props.tableName,
        OPENAI_API_KEY: props.openAiApiKey,
      },
      timeout: cdk.Duration.seconds(30),
    });
    askLeaderFunction.addToRolePolicy(dynamoPermissions);

    const askExpertFunction = new nodejs.NodejsFunction(this, "AskExpertFunction", {
      entry: "src/lambdas/ask-expert.lambda.ts",
      environment: {
        DYNAMODB_TABLE: props.tableName,
        OPENAI_API_KEY: props.openAiApiKey,
      },
      timeout: cdk.Duration.seconds(30),
    });
    askExpertFunction.addToRolePolicy(dynamoPermissions);

    const updateChatFunction = new nodejs.NodejsFunction(this, "UpdateChatFunction", {
      entry: "src/lambdas/update-chat.lambda.ts",
      environment: {
        DYNAMODB_TABLE: props.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });
    updateChatFunction.addToRolePolicy(dynamoPermissions);

    // Step Functions tasks
    const askLeader = new tasks.LambdaInvoke(this, "Ask Leader", {
      lambdaFunction: askLeaderFunction,
      resultPath: "$.leaderResponse",
      payloadResponseOnly: true,
    });

    const askExpert = new tasks.LambdaInvoke(this, "Ask Expert", {
      lambdaFunction: askExpertFunction,
      resultPath: "$.expertResponse",
      payloadResponseOnly: true,
    });

    const updateChat = new tasks.LambdaInvoke(this, "Update Chat", {
      lambdaFunction: updateChatFunction,
      resultPath: "$.updateResult",
      payloadResponseOnly: true,
    });

    const finalUpdateChat = new tasks.LambdaInvoke(this, "Final Update Chat", {
      lambdaFunction: updateChatFunction,
      resultPath: "$.updateResult",
      payloadResponseOnly: true,
    });

    // Pass state to increment turn counter
    const incrementTurn = new sfn.Pass(this, "Increment Turn", {
      parameters: {
        "currentTurn.$": "States.MathAdd($.currentTurn, 1)",
        "chatId.$": "$.updateResult.chatId",
        "createdAt.$": "$.updateResult.createdAt",
        "prompt.$": "$.updateResult.prompt",
        "maxTurns.$": "$.updateResult.maxTurns",
        "leaderResponse.$": "$.updateResult.leaderResponse",
        "expertResponse.$": "$.updateResult.expertResponse",
      },
    });

    // Define the main flow
    const discussionFlow = askExpert
      .next(
        new sfn.Pass(this, "Prepare Update", {
          parameters: {
            "chatId.$": "$.chatId",
            "createdAt.$": "$.createdAt",
            "leaderResponse.$": "$.leaderResponse",
            "expertResponse.$": "$.expertResponse",
            "currentTurn.$": "$.currentTurn",
            "maxTurns.$": "$.maxTurns",
          },
        })
      )
      .next(updateChat)
      .next(incrementTurn)
      .next(askLeader);

    // Add success state
    const success = new sfn.Succeed(this, "Discussion Complete");

    // Check if discussion should continue
    const shouldContinue = new sfn.Choice(this, "Should Continue?")
      .when(
        sfn.Condition.and(
          sfn.Condition.booleanEquals("$.leaderResponse.discussionComplete", false),
          sfn.Condition.numberLessThanEquals("$.currentTurn", 20)
        ),
        discussionFlow
      )
      .otherwise(
        new sfn.Pass(this, "Prepare Final Update", {
          parameters: {
            "chatId.$": "$.chatId",
            "createdAt.$": "$.createdAt",
            "leaderResponse.$": "$.leaderResponse",
            "currentTurn.$": "$.currentTurn",
            "maxTurns.$": "$.maxTurns",
          },
        })
          .next(finalUpdateChat)
          .next(success)
      );

    // Create the state machine
    const definition = sfn.Chain.start(askLeader).next(shouldContinue);

    this.stateMachine = new sfn.StateMachine(this, "ExpertDiscussionStateMachine", {
      definition,
      timeout: cdk.Duration.minutes(30),
    });
  }
}
