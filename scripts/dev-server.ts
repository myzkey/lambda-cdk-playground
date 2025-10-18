import express from 'express';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../lambda/hello-world/index';

const app = express();
const PORT = process.env.PORT || 3000;

// JSON解析のミドルウェア
app.use(express.json());

// CORS設定
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// すべてのルートをLambda関数にプロキシ
app.use('/', async (req, res) => {
  console.log(`[DevServer] ${req.method} ${req.path}`);

  // Express requestをAPI Gateway eventに変換
  const event: APIGatewayProxyEvent = {
    httpMethod: req.method,
    path: req.path,
    queryStringParameters: Object.keys(req.query).length > 0 ?
      Object.fromEntries(
        Object.entries(req.query).map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] as string : String(value)
        ])
      ) : null,
    pathParameters: null, // Express paramsがある場合は設定可能
    headers: req.headers as { [name: string]: string },
    body: req.method !== 'GET' && req.method !== 'HEAD' ?
      JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    requestContext: {
      requestId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stage: 'dev',
      httpMethod: req.method,
      path: req.path,
      protocol: 'HTTP/1.1',
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      identity: {
        sourceIp: req.ip || '127.0.0.1',
        userAgent: req.get('User-Agent') || '',
      },
      domainName: 'localhost',
      apiId: 'local-dev-api',
    } as any,
    resource: req.path,
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
  };

  try {
    // Lambda関数を実行
    const result = await handler(event);

    // Lambda responseをExpress responseに変換
    res.status(result.statusCode);

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.set(key, String(value));
      });
    }

    if (result.body) {
      try {
        // JSONかどうか確認してパース
        JSON.parse(result.body);
        res.json(JSON.parse(result.body));
      } catch {
        res.send(result.body);
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error('[DevServer] Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Development server error',
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Development server running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/`);
  console.log(`💡 Try: http://localhost:${PORT}/hello?name=Developer&lang=ja`);
});