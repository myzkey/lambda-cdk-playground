import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DEFAULT_HEADERS } from '../types';

/**
 * Hello ハンドラー - 挨拶メッセージを返す
 */
export const helloHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const name = event.queryStringParameters?.name || 'World';
  const language = event.queryStringParameters?.lang || 'en';

  const greetings: Record<string, string> = {
    en: `Hello, ${name}!`,
    ja: `こんにちは、${name}さん！`,
    es: `¡Hola, ${name}!`,
    fr: `Bonjour, ${name}!`,
    de: `Hallo, ${name}!`,
  };

  const message = greetings[language] || greetings.en;

  return {
    statusCode: 200,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      message,
      language,
      name,
      timestamp: new Date().toISOString(),
      requestId: event.requestContext.requestId,
    }),
  };
};