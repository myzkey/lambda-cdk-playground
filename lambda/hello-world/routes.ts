import { Router } from './router';
import { homeHandler } from './handlers/home';
import { helloHandler } from './handlers/hello';
import { getUsersHandler, getUserByIdHandler, createUserHandler } from './handlers/users';
import { healthHandler } from './handlers/health';

/**
 * ルートを設定する
 */
export function setupRoutes(): Router {
  const router = new Router();

  // ホームページ
  router.get('/', homeHandler);

  // Hello エンドポイント
  router.get('/hello', helloHandler);

  // ヘルスチェック
  router.get('/health', healthHandler);

  // ユーザー API
  router.get('/api/users', getUsersHandler);
  router.get('/api/users/:id', getUserByIdHandler);
  router.post('/api/users', createUserHandler);

  return router;
}