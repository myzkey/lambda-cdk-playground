import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class LambdaCdkPlaygroundStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Parameter Store パラメータの作成
    const appConfigParam = new ssm.StringParameter(this, 'AppConfigParameter', {
      parameterName: '/lambda-cdk-playground/app-config',
      stringValue: JSON.stringify({
        apiVersion: '1.0.0',
        environment: 'production',
        maxRetries: 3,
        timeout: 30000,
        features: {
          analytics: true,
          logging: true,
          rateLimit: 100
        }
      }),
      description: 'Application configuration for Lambda CDK Playground',
    });

    // Secrets Manager シークレットの作成
    const apiSecret = new secretsmanager.Secret(this, 'ApiSecret', {
      secretName: 'lambda-cdk-playground/api-keys',
      description: 'API keys and sensitive configuration',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          databaseUrl: 'postgresql://user:password@localhost:5432/mydb',
          jwtSecret: '',
          apiKey: '',
          externalApiKey: ''
        }),
        generateStringKey: 'jwtSecret',
        excludeCharacters: '"@/\\\'',
        passwordLength: 32,
      },
    });

    // ビルド時環境変数の設定
    const buildTimeEnvVars = {
      // WebHook URLs（デプロイ時に設定）
      SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
      DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
      TEAMS_WEBHOOK_URL: process.env.TEAMS_WEBHOOK_URL || '',
      GENERIC_WEBHOOK_URL: process.env.GENERIC_WEBHOOK_URL || '',

      // 外部API設定
      EXTERNAL_API_BASE_URL: process.env.EXTERNAL_API_BASE_URL || 'https://api.example.com',
      API_TIMEOUT: process.env.API_TIMEOUT || '30000',
      API_RETRIES: process.env.API_RETRIES || '3',

      // アプリケーション設定
      APP_VERSION: process.env.APP_VERSION || '1.0.0',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS || 'false',
      DEBUG: process.env.DEBUG || 'false',

      // 機能フラグ
      ENABLE_WEBHOOKS: process.env.ENABLE_WEBHOOKS || 'false',
      ENABLE_RATE_LIMIT: process.env.ENABLE_RATE_LIMIT || 'true',
      ENABLE_LOGGING: process.env.ENABLE_LOGGING || 'true',
      MAX_REQUESTS_PER_MINUTE: process.env.MAX_REQUESTS_PER_MINUTE || '100',

      // デプロイ情報
      GIT_COMMIT: process.env.GIT_COMMIT || '',
      GIT_BRANCH: process.env.GIT_BRANCH || '',
      DEPLOYMENT_ID: process.env.DEPLOYMENT_ID || '',
    };

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
        APP_CONFIG_PARAM: appConfigParam.parameterName,
        API_SECRET_ARN: apiSecret.secretArn,
        AWS_REGION: this.region,
        // ビルド時環境変数を追加
        ...buildTimeEnvVars,
      },
    });

    // Lambda関数にParameter Storeの読み取り権限を付与
    appConfigParam.grantRead(helloWorldFunction);

    // Lambda関数にSecrets Managerの読み取り権限を付与
    apiSecret.grantRead(helloWorldFunction);

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
