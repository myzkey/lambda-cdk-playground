import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { setupRoutes } from './routes';

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
