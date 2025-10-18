import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DEFAULT_HEADERS } from '../types';

/**
 * ヘルスチェックハンドラー
 */
export const healthHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  // 簡単なシステムチェック
  const checks = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    platform: process.platform,
  };

  const responseTime = Date.now() - startTime;

  return {
    statusCode: 200,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      checks,
      requestId: event.requestContext.requestId,
    }),
  };
};