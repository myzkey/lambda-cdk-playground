import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Route, HttpMethod, DEFAULT_HEADERS } from './types';

export class Router {
  private routes: Route[] = [];

  /**
   * ルートを登録する
   */
  register(method: HttpMethod, path: string, handler: Route['handler']): void {
    this.routes.push({ method, path, handler });
  }

  /**
   * GET ルートを登録する
   */
  get(path: string, handler: Route['handler']): void {
    this.register('GET', path, handler);
  }

  /**
   * POST ルートを登録する
   */
  post(path: string, handler: Route['handler']): void {
    this.register('POST', path, handler);
  }

  /**
   * PUT ルートを登録する
   */
  put(path: string, handler: Route['handler']): void {
    this.register('PUT', path, handler);
  }

  /**
   * DELETE ルートを登録する
   */
  delete(path: string, handler: Route['handler']): void {
    this.register('DELETE', path, handler);
  }

  /**
   * リクエストをルーティングする
   */
  async route(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const { httpMethod, path } = event;

    console.log(`[Router] ${httpMethod} ${path}`);

    // 完全一致するルートを検索
    const exactRoute = this.routes.find(
      route => route.method === httpMethod && route.path === path
    );

    if (exactRoute) {
      try {
        return await exactRoute.handler(event);
      } catch (error) {
        console.error('[Router] Handler error:', error);
        return this.createErrorResponse(500, 'Internal Server Error');
      }
    }

    // パスパラメータを含むルートを検索
    const paramRoute = this.findRouteWithParams(httpMethod as HttpMethod, path);
    if (paramRoute) {
      try {
        // パスパラメータをeventに追加
        const pathParams = this.extractPathParams(paramRoute.route.path, path);
        (event as any).pathParameters = { ...event.pathParameters, ...pathParams };

        return await paramRoute.route.handler(event);
      } catch (error) {
        console.error('[Router] Handler error:', error);
        return this.createErrorResponse(500, 'Internal Server Error');
      }
    }

    // ルートが見つからない場合
    if (this.routes.some(route => route.path === path)) {
      return this.createErrorResponse(405, 'Method Not Allowed', { method: httpMethod });
    }

    return this.createErrorResponse(404, 'Not Found', { path, method: httpMethod });
  }

  /**
   * パスパラメータを含むルートを検索
   */
  private findRouteWithParams(method: HttpMethod, requestPath: string) {
    for (const route of this.routes) {
      if (route.method === method && this.matchPathWithParams(route.path, requestPath)) {
        return { route, params: this.extractPathParams(route.path, requestPath) };
      }
    }
    return null;
  }

  /**
   * パスパラメータを含むパスがマッチするかチェック
   */
  private matchPathWithParams(routePath: string, requestPath: string): boolean {
    const routeParts = routePath.split('/');
    const requestParts = requestPath.split('/');

    if (routeParts.length !== requestParts.length) {
      return false;
    }

    return routeParts.every((part, index) => {
      return part.startsWith(':') || part === requestParts[index];
    });
  }

  /**
   * パスパラメータを抽出
   */
  private extractPathParams(routePath: string, requestPath: string): Record<string, string> {
    const routeParts = routePath.split('/');
    const requestParts = requestPath.split('/');
    const params: Record<string, string> = {};

    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = requestParts[index];
      }
    });

    return params;
  }

  /**
   * エラーレスポンスを作成
   */
  private createErrorResponse(
    statusCode: number,
    error: string,
    additionalData?: Record<string, any>
  ): APIGatewayProxyResult {
    return {
      statusCode,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        error,
        timestamp: new Date().toISOString(),
        ...additionalData,
      }),
    };
  }

  /**
   * 登録されているルートの一覧を取得
   */
  getRoutes(): Array<{ method: string; path: string }> {
    return this.routes.map(route => ({
      method: route.method,
      path: route.path,
    }));
  }
}