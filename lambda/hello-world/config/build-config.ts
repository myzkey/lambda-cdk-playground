/**
 * ビルド時に環境変数から設定を読み込む
 * Runtime ではなく Build time で設定を決定
 */

// ビルド時の環境変数から設定を読み込み
export const BUILD_CONFIG = {
  // WebHook URLs
  webhooks: {
    slack: process.env.SLACK_WEBHOOK_URL || '',
    discord: process.env.DISCORD_WEBHOOK_URL || '',
    teams: process.env.TEAMS_WEBHOOK_URL || '',
    generic: process.env.GENERIC_WEBHOOK_URL || '',
  },

  // 外部API設定
  externalApis: {
    baseUrl: process.env.EXTERNAL_API_BASE_URL || 'https://api.example.com',
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retries: parseInt(process.env.API_RETRIES || '3'),
  },

  // アプリケーション設定
  app: {
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    enableDebug: process.env.DEBUG === 'true',
  },

  // 機能フラグ
  features: {
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false', // デフォルト有効
    enableLogging: process.env.ENABLE_LOGGING !== 'false', // デフォルト有効
    maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '100'),
  },

  // デプロイ情報
  deployment: {
    buildTimestamp: new Date().toISOString(),
    gitCommit: process.env.GIT_COMMIT || '',
    gitBranch: process.env.GIT_BRANCH || '',
    deploymentId: process.env.DEPLOYMENT_ID || '',
  },
} as const;

/**
 * 設定値の検証
 */
export function validateBuildConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // WebHook URLの検証
  if (BUILD_CONFIG.features.enableWebhooks) {
    if (!BUILD_CONFIG.webhooks.slack && !BUILD_CONFIG.webhooks.discord &&
        !BUILD_CONFIG.webhooks.teams && !BUILD_CONFIG.webhooks.generic) {
      warnings.push('WebHooks are enabled but no webhook URLs are configured');
    }
  }

  // 外部API設定の検証
  if (BUILD_CONFIG.externalApis.timeout < 1000) {
    warnings.push('API timeout is very low (< 1000ms)');
  }

  if (BUILD_CONFIG.externalApis.retries > 10) {
    warnings.push('API retries are very high (> 10)');
  }

  // 本番環境での必須設定チェック
  if (BUILD_CONFIG.app.environment === 'production') {
    if (!BUILD_CONFIG.deployment.gitCommit) {
      warnings.push('GIT_COMMIT is not set (recommended for tracking deployments)');
    }

    if (BUILD_CONFIG.app.enableDebug) {
      warnings.push('Debug mode is enabled in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 公開可能な設定のみを返す（機密情報を除外）
 */
export function getPublicConfig() {
  return {
    app: {
      version: BUILD_CONFIG.app.version,
      environment: BUILD_CONFIG.app.environment,
      logLevel: BUILD_CONFIG.app.logLevel,
    },
    features: {
      enableRateLimit: BUILD_CONFIG.features.enableRateLimit,
      enableLogging: BUILD_CONFIG.features.enableLogging,
      maxRequestsPerMinute: BUILD_CONFIG.features.maxRequestsPerMinute,
      // enableWebhooks は公開しない（攻撃者に情報を与える）
    },
    deployment: {
      buildTimestamp: BUILD_CONFIG.deployment.buildTimestamp,
      gitBranch: BUILD_CONFIG.deployment.gitBranch,
      // gitCommit, deploymentId は公開しない
    },
  };
}

/**
 * ビルド時設定の初期化（ビルド時に実行される）
 */
export function initializeBuildConfig(): void {
  const validation = validateBuildConfig();

  console.log('🔧 Build Configuration:');
  console.log(`   Environment: ${BUILD_CONFIG.app.environment}`);
  console.log(`   Version: ${BUILD_CONFIG.app.version}`);
  console.log(`   WebHooks: ${BUILD_CONFIG.features.enableWebhooks ? 'Enabled' : 'Disabled'}`);
  console.log(`   Rate Limit: ${BUILD_CONFIG.features.enableRateLimit ? 'Enabled' : 'Disabled'}`);

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Configuration Warnings:');
    validation.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  if (!validation.isValid) {
    console.error('❌ Configuration Errors:');
    validation.errors.forEach(error => console.error(`   - ${error}`));
    throw new Error('Invalid build configuration');
  }

  console.log('✅ Build configuration validated successfully');
}

// ビルド時に設定を初期化
initializeBuildConfig();