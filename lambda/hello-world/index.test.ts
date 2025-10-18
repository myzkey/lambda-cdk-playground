import { handler } from './index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

describe('Lambda handler', () => {
  it('should return hello world message', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      queryStringParameters: null,
      requestContext: {
        requestId: 'test-request-id'
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toMatchObject({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello, World!');
    expect(body.requestId).toBe('test-request-id');
    expect(body.timestamp).toBeDefined();
  });

  it('should return personalized message when name is provided', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      queryStringParameters: { name: 'Alice' },
      requestContext: {
        requestId: 'test-request-id-2'
      } as any,
    };

    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Hello, Alice!');
  });
});