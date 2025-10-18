import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DEFAULT_HEADERS } from '../types';

/**
 * ホームページハンドラー - API の概要を返す
 */
export const homeHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const availableEndpoints = [
    { method: 'GET', path: '/', description: 'API overview' },
    { method: 'GET', path: '/hello', description: 'Hello world message' },
    { method: 'GET', path: '/api/users', description: 'Get all users' },
    { method: 'GET', path: '/api/users/:id', description: 'Get user by ID' },
    { method: 'POST', path: '/api/users', description: 'Create new user' },
    { method: 'GET', path: '/health', description: 'Health check' },
  ];

  return {
    statusCode: 200,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      message: 'Welcome to Lambda CDK Playground API',
      version: '1.0.0',
      endpoints: availableEndpoints,
      timestamp: new Date().toISOString(),
      requestId: event.requestContext.requestId,
    }),
  };
};