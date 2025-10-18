import {
  SSMClient,
  GetParameterCommand,
  GetParametersCommand,
} from '@aws-sdk/client-ssm';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// AWS クライアントの初期化
const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// キャッシュ用のインターfaces
interface ConfigCache {
  [key: string]: {
    value: any;
    timestamp: number;
    ttl: number;
  };
}

const cache: ConfigCache = {};
const DEFAULT_TTL = 5 * 60 * 1000; // 5分

/**
 * Parameter Store から設定値を取得
 */
export async function getParameter(
  parameterName: string,
  withDecryption: boolean = false,
  ttl: number = DEFAULT_TTL
): Promise<string | null> {
  const cacheKey = `param:${parameterName}`;

  // キャッシュから確認
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < cache[cacheKey].ttl) {
    console.log(`[Config] Cache hit for parameter: ${parameterName}`);
    return cache[cacheKey].value;
  }

  try {
    console.log(`[Config] Fetching parameter: ${parameterName}`);
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: withDecryption,
    });

    const response = await ssmClient.send(command);
    const value = response.Parameter?.Value || null;

    // キャッシュに保存
    cache[cacheKey] = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    return value;
  } catch (error) {
    console.error(`[Config] Failed to get parameter ${parameterName}:`, error);
    return null;
  }
}

/**
 * 複数のParameter Store パラメータを一括取得
 */
export async function getParameters(
  parameterNames: string[],
  withDecryption: boolean = false,
  ttl: number = DEFAULT_TTL
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const uncachedParams: string[] = [];

  // キャッシュチェック
  for (const paramName of parameterNames) {
    const cacheKey = `param:${paramName}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < cache[cacheKey].ttl) {
      result[paramName] = cache[cacheKey].value;
    } else {
      uncachedParams.push(paramName);
    }
  }

  if (uncachedParams.length === 0) {
    console.log('[Config] All parameters found in cache');
    return result;
  }

  try {
    console.log(`[Config] Fetching parameters: ${uncachedParams.join(', ')}`);
    const command = new GetParametersCommand({
      Names: uncachedParams,
      WithDecryption: withDecryption,
    });

    const response = await ssmClient.send(command);

    if (response.Parameters) {
      for (const param of response.Parameters) {
        if (param.Name && param.Value) {
          result[param.Name] = param.Value;

          // キャッシュに保存
          const cacheKey = `param:${param.Name}`;
          cache[cacheKey] = {
            value: param.Value,
            timestamp: Date.now(),
            ttl,
          };
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[Config] Failed to get parameters:', error);
    return result;
  }
}

/**
 * Secrets Manager からシークレットを取得
 */
export async function getSecret(
  secretId: string,
  ttl: number = DEFAULT_TTL
): Promise<any> {
  const cacheKey = `secret:${secretId}`;

  // キャッシュから確認
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < cache[cacheKey].ttl) {
    console.log(`[Config] Cache hit for secret: ${secretId}`);
    return cache[cacheKey].value;
  }

  try {
    console.log(`[Config] Fetching secret: ${secretId}`);
    const command = new GetSecretValueCommand({
      SecretId: secretId,
    });

    const response = await secretsClient.send(command);
    let secretValue;

    if (response.SecretString) {
      try {
        secretValue = JSON.parse(response.SecretString);
      } catch {
        secretValue = response.SecretString;
      }
    } else if (response.SecretBinary) {
      secretValue = Buffer.from(response.SecretBinary).toString('utf-8');
    } else {
      secretValue = null;
    }

    // キャッシュに保存
    cache[cacheKey] = {
      value: secretValue,
      timestamp: Date.now(),
      ttl,
    };

    return secretValue;
  } catch (error) {
    console.error(`[Config] Failed to get secret ${secretId}:`, error);
    return null;
  }
}

/**
 * アプリケーション設定を取得
 */
export async function getAppConfig(): Promise<any> {
  const configParam = process.env.APP_CONFIG_PARAM;
  if (!configParam) {
    console.warn('[Config] APP_CONFIG_PARAM environment variable not set');
    return {};
  }

  const configString = await getParameter(configParam);
  if (!configString) {
    console.warn('[Config] Failed to get app config');
    return {};
  }

  try {
    return JSON.parse(configString);
  } catch (error) {
    console.error('[Config] Failed to parse app config:', error);
    return {};
  }
}

/**
 * API シークレットを取得
 */
export async function getApiSecrets(): Promise<any> {
  const secretArn = process.env.API_SECRET_ARN;
  if (!secretArn) {
    console.warn('[Config] API_SECRET_ARN environment variable not set');
    return {};
  }

  return await getSecret(secretArn);
}

/**
 * キャッシュをクリア
 */
export function clearCache(): void {
  console.log('[Config] Clearing configuration cache');
  Object.keys(cache).forEach(key => delete cache[key]);
}