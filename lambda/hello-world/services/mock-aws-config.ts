/**
 * ローカル開発用のモック設定
 * 実際のAWSサービスがない環境での開発をサポート
 */

const mockAppConfig = {
  apiVersion: '1.0.0',
  environment: 'development',
  maxRetries: 3,
  timeout: 30000,
  features: {
    analytics: true,
    logging: true,
    rateLimit: 100,
  },
};

const mockApiSecrets = {
  databaseUrl: 'postgresql://localhost:5432/dev_db',
  jwtSecret: 'dev-jwt-secret-key-not-for-production',
  apiKey: 'dev-api-key-12345',
  externalApiKey: 'dev-external-api-key-67890',
};

/**
 * ローカル開発環境かどうかを判定
 */
export function isLocalDevelopment(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    !process.env.AWS_REGION ||
    !process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}

/**
 * モックアプリケーション設定を取得
 */
export async function getMockAppConfig(): Promise<any> {
  console.log('[MockConfig] Using mock app configuration for local development');
  return mockAppConfig;
}

/**
 * モックAPIシークレットを取得
 */
export async function getMockApiSecrets(): Promise<any> {
  console.log('[MockConfig] Using mock API secrets for local development');
  return mockApiSecrets;
}

/**
 * 環境に応じて設定を取得（本番: AWS、開発: モック）
 */
export async function getConfigForEnvironment(): Promise<{
  appConfig: any;
  apiSecrets: any;
}> {
  if (isLocalDevelopment()) {
    return {
      appConfig: await getMockAppConfig(),
      apiSecrets: await getMockApiSecrets(),
    };
  }

  // 本番環境では実際のAWS設定サービスを使用
  try {
    const awsConfig = require('./aws-config');
    return {
      appConfig: await awsConfig.getAppConfig(),
      apiSecrets: await awsConfig.getApiSecrets(),
    };
  } catch (error) {
    console.error('[Config] Failed to load AWS config, falling back to mock:', error);
    return {
      appConfig: await getMockAppConfig(),
      apiSecrets: await getMockApiSecrets(),
    };
  }
}