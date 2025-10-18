import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('Lambda handler with advanced routing', () => {
  const baseEvent = {
    queryStringParameters: null,
    pathParameters: null,
    body: null,
    requestContext: {
      requestId: 'test-request-id',
    } as any,
  };

  describe('Root path (/)', () => {
    it('should return API overview with endpoints', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        ...baseEvent,
        httpMethod: 'GET',
        path: '/',
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Welcome to Lambda CDK Playground API');
      expect(body.endpoints).toBeDefined();
      expect(body.version).toBe('1.0.0');
    });
  });

  describe('Hello path (/hello)', () => {
    it('should return hello message in English by default', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        ...baseEvent,
        httpMethod: 'GET',
        path: '/hello',
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Hello, World!');
      expect(body.language).toBe('en');
    });

    it('should return personalized message with name', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        ...baseEvent,
        httpMethod: 'GET',
        path: '/hello',
        queryStringParameters: { name: 'Alice' },
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('Hello, Alice!');
      expect(body.name).toBe('Alice');
    });

    it('should support multiple languages', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        ...baseEvent,
        httpMethod: 'GET',
        path: '/hello',
        queryStringParameters: { name: 'Alice', lang: 'ja' },
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.message).toBe('こんにちは、Aliceさん！');
      expect(body.language).toBe('ja');
    });
  });

  describe('Health check (/health)', () => {
    it('should return health status', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        ...baseEvent,
        httpMethod: 'GET',
        path: '/health',
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('healthy');
      expect(body.checks).toBeDefined();
      expect(body.responseTime).toBeDefined();
    });
  });

  describe('Users API', () => {
    describe('GET /api/users', () => {
      it('should return paginated users list', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
          ...baseEvent,
          httpMethod: 'GET',
          path: '/api/users',
        };

        const result = await handler(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.users).toHaveLength(5);
        expect(body.pagination).toMatchObject({
          total: 5,
          limit: 10,
          offset: 0,
          hasMore: false,
        });
      });

      it('should support role filtering', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
          ...baseEvent,
          httpMethod: 'GET',
          path: '/api/users',
          queryStringParameters: { role: 'admin' },
        };

        const result = await handler(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.users).toHaveLength(1);
        expect(body.users[0].role).toBe('admin');
      });
    });

    describe('GET /api/users/:id', () => {
      it('should return specific user by ID', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
          ...baseEvent,
          httpMethod: 'GET',
          path: '/api/users/1',
          pathParameters: { id: '1' },
        };

        const result = await handler(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.user.id).toBe(1);
        expect(body.user.name).toBe('Alice Johnson');
      });

      it('should return 404 for non-existent user', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
          ...baseEvent,
          httpMethod: 'GET',
          path: '/api/users/999',
          pathParameters: { id: '999' },
        };

        const result = await handler(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(404);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Not Found');
      });
    });

    describe('POST /api/users', () => {
      it('should create new user', async () => {
        const newUser = {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        };

        const event: Partial<APIGatewayProxyEvent> = {
          ...baseEvent,
          httpMethod: 'POST',
          path: '/api/users',
          body: JSON.stringify(newUser),
        };

        const result = await handler(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.message).toBe('User created successfully');
        expect(body.user.name).toBe('John Doe');
        expect(body.user.id).toBeGreaterThan(5);
      });

      it('should return 400 for invalid request body', async () => {
        const event: Partial<APIGatewayProxyEvent> = {
          ...baseEvent,
          httpMethod: 'POST',
          path: '/api/users',
          body: JSON.stringify({ name: 'John' }), // missing email
        };

        const result = await handler(event as APIGatewayProxyEvent);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body);
        expect(body.error).toBe('Bad Request');
      });
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown paths', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        ...baseEvent,
        httpMethod: 'GET',
        path: '/unknown',
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Not Found');
    });

    it('should return 405 for unsupported methods', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        ...baseEvent,
        httpMethod: 'PATCH',
        path: '/hello',
      };

      const result = await handler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(405);
      const body = JSON.parse(result.body);
      expect(body.error).toBe('Method Not Allowed');
    });
  });
});
