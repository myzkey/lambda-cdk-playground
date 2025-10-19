import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DEFAULT_HEADERS } from '../types';

// モックユーザーデータ
const mockUsers = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'user' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'moderator' },
  { id: 5, name: 'Eve Wilson', email: 'eve@example.com', role: 'user' },
];

/**
 * 全ユーザー取得ハンドラー
 */
export const getUsersHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const limit = parseInt(event.queryStringParameters?.limit || '10');
  const offset = parseInt(event.queryStringParameters?.offset || '0');
  const role = event.queryStringParameters?.role;

  let filteredUsers = mockUsers;

  // ロールフィルタリング
  if (role) {
    filteredUsers = mockUsers.filter(user => user.role === role);
  }

  // ページネーション
  const paginatedUsers = filteredUsers.slice(offset, offset + limit);

  return {
    statusCode: 200,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      users: paginatedUsers,
      pagination: {
        total: filteredUsers.length,
        limit,
        offset,
        hasMore: offset + limit < filteredUsers.length,
      },
      timestamp: new Date().toISOString(),
      requestId: event.requestContext.requestId,
    }),
  };
};

/**
 * 特定ユーザー取得ハンドラー
 */
export const getUserByIdHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.pathParameters?.id;

  if (!userId) {
    return {
      statusCode: 400,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'User ID is required',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  const user = mockUsers.find(u => u.id === parseInt(userId));

  if (!user) {
    return {
      statusCode: 404,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        error: 'Not Found',
        message: `User with ID ${userId} not found`,
        timestamp: new Date().toISOString(),
      }),
    };
  }

  return {
    statusCode: 200,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      user,
      timestamp: new Date().toISOString(),
      requestId: event.requestContext.requestId,
    }),
  };
};

/**
 * ユーザー作成ハンドラー
 */
export const createUserHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let requestBody;

  try {
    requestBody = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'Invalid JSON in request body',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  const { name, email, role = 'user' } = requestBody;

  // バリデーション
  if (!name || !email) {
    return {
      statusCode: 400,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'Name and email are required',
        timestamp: new Date().toISOString(),
      }),
    };
  }

  // 新しいユーザーを作成（実際のアプリではデータベースに保存）
  const newUser = {
    id: Math.max(...mockUsers.map(u => u.id)) + 1,
    name,
    email,
    role,
  };

  return {
    statusCode: 201,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      message: 'User created successfully',
      user: newUser,
      timestamp: new Date().toISOString(),
      requestId: event.requestContext.requestId,
    }),
  };
};