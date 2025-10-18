import { handler } from '../lambda/hello-world/index';
import { APIGatewayProxyEvent } from 'aws-lambda';

const createTestEvent = (
  method: string = 'GET',
  path: string = '/',
  queryStringParameters: Record<string, string> | null = null,
  body: string | null = null,
  pathParameters: Record<string, string> | null = null
): APIGatewayProxyEvent => ({
  httpMethod: method,
  path,
  queryStringParameters,
  pathParameters,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Test-Agent/1.0',
  },
  body,
  isBase64Encoded: false,
  requestContext: {
    requestId: `test-${Date.now()}`,
    stage: 'test',
    httpMethod: method,
    path,
    protocol: 'HTTP/1.1',
    requestTime: new Date().toISOString(),
    requestTimeEpoch: Date.now(),
    identity: {
      sourceIp: '127.0.0.1',
      userAgent: 'Test-Agent/1.0',
    },
    domainName: 'localhost',
    apiId: 'test-api',
  } as any,
  resource: path,
  stageVariables: null,
  multiValueHeaders: {},
  multiValueQueryStringParameters: null,
});

async function testEndpoints() {
  console.log('🧪 Testing Lambda function locally...\n');

  const tests = [
    {
      name: 'GET / - API Overview',
      event: createTestEvent('GET', '/'),
    },
    {
      name: 'GET /hello - Simple greeting',
      event: createTestEvent('GET', '/hello'),
    },
    {
      name: 'GET /hello?name=Alice&lang=ja - Japanese greeting',
      event: createTestEvent('GET', '/hello', { name: 'Alice', lang: 'ja' }),
    },
    {
      name: 'GET /health - Health check',
      event: createTestEvent('GET', '/health'),
    },
    {
      name: 'GET /api/users - Users list',
      event: createTestEvent('GET', '/api/users'),
    },
    {
      name: 'GET /api/users?role=admin - Admin users',
      event: createTestEvent('GET', '/api/users', { role: 'admin' }),
    },
    {
      name: 'GET /api/users/1 - Specific user',
      event: createTestEvent('GET', '/api/users/1', null, null, { id: '1' }),
    },
    {
      name: 'POST /api/users - Create user',
      event: createTestEvent(
        'POST',
        '/api/users',
        null,
        JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
        })
      ),
    },
    {
      name: 'POST /api/webhook/send - Send webhook',
      event: createTestEvent(
        'POST',
        '/api/webhook/send',
        null,
        JSON.stringify({
          message: 'Test webhook message from Lambda CDK Playground',
          type: 'generic',
        })
      ),
    },
    {
      name: 'GET /unknown - 404 test',
      event: createTestEvent('GET', '/unknown'),
    },
  ];

  for (const test of tests) {
    console.log(`📋 ${test.name}`);
    console.log(`   ${test.event.httpMethod} ${test.event.path}`);

    try {
      const result = await handler(test.event);
      const body = JSON.parse(result.body);

      console.log(`   ✅ ${result.statusCode} - ${JSON.stringify(body).substring(0, 100)}...`);
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }

    console.log('');
  }

  console.log('🎉 Testing completed!');
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  testEndpoints().catch(console.error);
}