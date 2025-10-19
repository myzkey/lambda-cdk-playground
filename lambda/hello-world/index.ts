import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { setupRoutes } from './routes';
import { authenticateWebhook } from './utils/webhook-auth';

// ルーターのインスタンスを作成（コールドスタート時に一度だけ実行）
const router = setupRoutes();

/**
 * Lambda ハンドラー - ルーターにリクエストを委譲
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(`[Handler] ${event.httpMethod} ${event.path}`);
  console.log('[Handler] Event:', JSON.stringify(event, null, 2));

  try {
    // Webhook認証
    const authResult = authenticateWebhook(
      event.httpMethod,
      event.path,
      event.headers,
      event.body || '',
      {
        githubSecret: process.env.GITHUB_WEBHOOK_SECRET,
        awsSecret: process.env.AWS_WEBHOOK_SECRET,
        pathSecret: process.env.WEBHOOK_PATH_SECRET,
      }
    );

    if (!authResult.isValid) {
      console.warn(`[Auth] Webhook authentication failed: ${authResult.error}`);
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Webhook authentication failed',
          timestamp: new Date().toISOString(),
          requestId: event.requestContext.requestId,
        }),
      };
    }

    if (authResult.service) {
      console.log(`[Auth] Authenticated webhook from: ${authResult.service}`);
    }

    return await router.route(event);
  } catch (error) {
    console.error('[Handler] Unexpected error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: event.requestContext.requestId,
      }),
    };
  }
};
