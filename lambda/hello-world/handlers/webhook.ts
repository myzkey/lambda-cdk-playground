import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DEFAULT_HEADERS } from '../types';
import { BUILD_CONFIG } from '../config/build-config';

/**
 * WebHook送信ハンドラー
 */
export const sendWebhookHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // WebHook機能が無効の場合は早期リターン
    if (!BUILD_CONFIG.features.enableWebhooks) {
      return {
        statusCode: 400,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          error: 'WebHook functionality is disabled',
          timestamp: new Date().toISOString(),
          requestId: event.requestContext.requestId,
        }),
      };
    }

    // リクエストボディを解析
    let body: unknown = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({
            error: 'Invalid JSON in request body',
            timestamp: new Date().toISOString(),
          }),
        };
      }
    }

    // 型ガードでbodyの形状を確認
    const isValidBody = (obj: unknown): obj is { message?: string; type?: string } => {
      return typeof obj === 'object' && obj !== null;
    };

    if (!isValidBody(body)) {
      return {
        statusCode: 400,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          error: 'Invalid request body format',
        }),
      };
    }

    const { message, type = 'generic' } = body;

    if (!message) {
      return {
        statusCode: 400,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          error: 'Message is required',
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // WebHook URLを取得
    let webhookUrl: string = '';
    switch (type) {
      case 'slack':
        webhookUrl = BUILD_CONFIG.webhooks.slack;
        break;
      case 'discord':
        webhookUrl = BUILD_CONFIG.webhooks.discord;
        break;
      case 'teams':
        webhookUrl = BUILD_CONFIG.webhooks.teams;
        break;
      case 'generic':
      default:
        webhookUrl = BUILD_CONFIG.webhooks.generic;
        break;
    }

    if (!webhookUrl) {
      return {
        statusCode: 400,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
          error: `WebHook URL for type '${type}' is not configured`,
          availableTypes: Object.keys(BUILD_CONFIG.webhooks).filter(
            key => BUILD_CONFIG.webhooks[key as keyof typeof BUILD_CONFIG.webhooks]
          ),
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // WebHookペイロードを準備
    const payload = {
      text: message,
      timestamp: new Date().toISOString(),
      source: 'Lambda CDK Playground',
      environment: BUILD_CONFIG.app.environment,
      version: BUILD_CONFIG.app.version,
    };

    // WebHookを送信（実際の環境では fetch を使用）
    console.log(`[WebHook] Sending to ${type}: ${webhookUrl}`);
    console.log(`[WebHook] Payload:`, payload);

    // モック送信（実際の実装では fetch でHTTP POSTを送信）
    const simulatedResponse = {
      status: 'success',
      message: 'WebHook sent successfully',
      type,
      url: webhookUrl.substring(0, 20) + '***', // URLを部分的に隠す
      payload,
    };

    return {
      statusCode: 200,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        result: simulatedResponse,
        timestamp: new Date().toISOString(),
        requestId: event.requestContext.requestId,
      }),
    };
  } catch (error) {
    console.error('[WebHook] Failed to send webhook:', error);
    return {
      statusCode: 500,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        error: 'Failed to send webhook',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

// getWebhookStatusHandler は削除されました（セキュリティ上の理由）
// WebHookの設定状況をAPIで公開するのは危険です