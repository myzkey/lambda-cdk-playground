import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface RouteHandler {
  (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
}

export interface Route {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}

export interface ApiResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};