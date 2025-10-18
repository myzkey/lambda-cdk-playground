import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class LambdaCdkPlaygroundStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda関数の作成
    const helloWorldFunction = new lambda.Function(this, 'HelloWorldFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../lambda/hello-world')
      ),
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
      },
    });

    // API Gatewayの作成
    const api = new apigateway.RestApi(this, 'HelloWorldApi', {
      restApiName: 'Hello World Service',
      description: 'This service serves a simple hello world response.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
    });

    // Lambda統合の作成
    const helloWorldIntegration = new apigateway.LambdaIntegration(
      helloWorldFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // プロキシ統合を使用してすべてのパスとメソッドを単一のLambda関数にルーティング
    api.root.addProxy({
      defaultIntegration: helloWorldIntegration,
      anyMethod: true,
    });

    // ルートレベルでのメソッド追加
    api.root.addMethod('GET', helloWorldIntegration);
    api.root.addMethod('POST', helloWorldIntegration);
    api.root.addMethod('PUT', helloWorldIntegration);
    api.root.addMethod('DELETE', helloWorldIntegration);

    // 出力値の定義
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: helloWorldFunction.functionName,
      description: 'The name of the Lambda function',
    });
  }
}
