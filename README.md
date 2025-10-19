# Lambda CDK Playground

TypeScriptで書かれたLambda関数とAWS CDKを使用したサンプルプロジェクトです。
このプロジェクトでは、Hello Worldレスポンスを返すLambda関数をAPI Gateway経由で公開します。

## プロジェクト構成

```txt
lambda-cdk-playground/
├── bin/                    # CDKアプリのエントリーポイント
├── lib/                    # CDKスタック定義
├── lambda/                 # Lambda関数のソースコード
│   └── hello-world/        # Hello World Lambda関数
│       ├── index.ts        # Lambda関数のメインコード
│       ├── index.test.ts   # Unit tests
│       └── tsconfig.json   # Lambda用TypeScript設定
├── test/                   # CDKスタックのテスト
├── cdk.json               # CDK設定ファイル
├── package.json           # 依存関係とスクリプト
└── tsconfig.json          # TypeScript設定
```

## 前提条件

- Node.js 18以上
- pnpm
- AWS CLI（デプロイする場合）
- AWS CDK CLI
- SAM CLI（SAMローカル実行する場合、オプション）

## セットアップ

1. 依存関係のインストール：

```bash
pnpm install
```

2. プロジェクトのビルド：

```bash
pnpm run build
```

3. CloudFormationテンプレートの生成：

```bash
pnpm run synth
```

## ローカル開発

### 方法1: Express開発サーバー（推奨）

最も高速で開発効率の良い方法です：

```bash
# 開発サーバー起動（ワンタイム）
pnpm run dev

# 開発サーバー起動（ファイル変更監視付き）
pnpm run dev:watch
```

**起動後の確認**:
- サーバーURL: http://localhost:3000
- API概要: http://localhost:3000/
- Hello API: http://localhost:3000/hello?name=YourName&lang=ja
- ユーザーAPI: http://localhost:3000/api/users
- ヘルスチェック: http://localhost:3000/health

**動作例**:
```bash
# API概要を確認
curl http://localhost:3000/

# 日本語で挨拶
curl "http://localhost:3000/hello?name=開発者&lang=ja"

# ユーザー一覧
curl http://localhost:3000/api/users

# 新規ユーザー作成
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "テストユーザー", "email": "test@example.com"}'
```

### 方法2: SAM CLI

AWS環境により近いテスト環境（要SAM CLI）：

```bash
# SAM CLIでローカル起動
pnpm run local:start

# 単発でLambda関数実行
pnpm run local:invoke
```

### 方法3: テストスクリプト

CI/CDやクイックテスト用：

```bash
# 全エンドポイントを一括テスト
pnpm run test:lambda
```

**実行例**:
```
🧪 Testing Lambda function locally...

📋 GET / - API Overview
   GET /
   ✅ 200 - {"message":"Welcome to Lambda CDK Playground API"...

📋 GET /hello?name=Alice&lang=ja - Japanese greeting
   GET /hello
   ✅ 200 - {"message":"こんにちは、Aliceさん！"...
```

## テスト実行

```bash
pnpm test
```

## デプロイ

AWS環境にデプロイする前に、AWS CDKのブートストラップが必要です：

```bash
npx cdk bootstrap
```

その後、スタックをデプロイ：

```bash
pnpm run deploy
```

デプロイ後、出力されるAPI URLにアクセスしてテストできます：

### 利用可能なエンドポイント

- **`GET /`** - API概要とエンドポイント一覧
- **`GET /hello`** - 多言語対応の挨拶メッセージ
  - `?name=Alice` - 名前指定
  - `?lang=ja` - 言語指定（en, ja, es, fr, de）
- **`GET /health`** - ヘルスチェック
- **`GET /api/users`** - ユーザー一覧（ページネーション対応）
  - `?limit=5&offset=0` - ページネーション
  - `?role=admin` - ロールフィルタリング
- **`GET /api/users/:id`** - 特定ユーザー取得
- **`POST /api/users`** - 新規ユーザー作成

### 使用例

```bash
# API概要
curl https://your-api-id.execute-api.region.amazonaws.com/prod/

# 日本語で挨拶
curl "https://your-api-id.execute-api.region.amazonaws.com/prod/hello?name=田中&lang=ja"

# ユーザー一覧
curl https://your-api-id.execute-api.region.amazonaws.com/prod/api/users

# 特定ユーザー
curl https://your-api-id.execute-api.region.amazonaws.com/prod/api/users/1

# ユーザー作成
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/prod/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "山田太郎", "email": "yamada@example.com", "role": "user"}'
```

## 利用可能なコマンド

### ビルドとデプロイ

- `pnpm run clean` - ビルド成果物をクリーンアップ
- `pnpm run build` - TypeScriptをJavaScriptにコンパイル
- `pnpm run build:lambda` - Lambda関数のみをビルド
- `pnpm run watch` - ファイル変更を監視してコンパイル
- `pnpm run test` - Jest単体テストを実行
- `pnpm run synth` - CloudFormationテンプレートを生成
- `pnpm run deploy` - スタックをAWSにデプロイ（自動承認）
- `pnpm cdk diff` - デプロイされたスタックと現在の状態を比較

### スタック削除とリセット

- `pnpm run destroy` - CDKスタックを強制削除
- `pnpm run reset` - CDKの状態ファイル（cdk.out, cdk.context.json）をリセット
- `pnpm run destroy:clean` - スタック削除 + 状態リセットを一度に実行

### ローカル開発用コマンド

- `pnpm run dev` - Express開発サーバー起動
- `pnpm run dev:watch` - ファイル変更監視付き開発サーバー
- `pnpm run test:lambda` - Lambda関数の動作テスト
- `pnpm run local:start` - SAM CLIでローカル起動
- `pnpm run local:invoke` - SAM CLIで単発実行

## アーキテクチャ

### ルーティングシステム

このプロジェクトでは、単一のLambda関数で複数のエンドポイントを処理する高度なルーティングシステムを実装しています：

```
lambda/hello-world/
├── index.ts              # メインハンドラー（ルーターに委譲）
├── router.ts             # ルーティング機能
├── routes.ts             # ルート設定
├── types.ts              # 型定義
└── handlers/            # 各エンドポイントのハンドラー
    ├── home.ts          # ホームページ
    ├── hello.ts         # 挨拶メッセージ
    ├── health.ts        # ヘルスチェック
    └── users.ts         # ユーザーAPI
```

### 主な機能

- **パスパラメータ対応**: `/api/users/:id` 形式のルーティング
- **HTTPメソッド別処理**: GET, POST, PUT, DELETE対応
- **エラーハンドリング**: 404, 405, 500エラーの適切な処理
- **CORS設定**: すべてのエンドポイントでCORS有効
- **バリデーション**: リクエストデータの検証
- **ページネーション**: ユーザー一覧でのページング機能
- **フィルタリング**: ロール別ユーザー検索

## 開発ワークフロー

### 推奨開発フロー

1. **ローカル開発**: `pnpm run dev:watch` でホットリロード開発
2. **機能テスト**: `pnpm run test:lambda` で全機能確認
3. **Jest テスト**: `pnpm test` で単体テスト実行
4. **本格テスト**: `pnpm run local:start` でAWS環境に近いテスト（オプション）
5. **デプロイ**: `pnpm run deploy` でAWSへデプロイ

## スタック削除とクリーンアップ

### 基本的な削除コマンド

```bash
# CDKスタックのみを削除
pnpm run destroy

# CDKの状態ファイルのみをリセット
pnpm run reset

# スタック削除 + 状態リセットを一度に実行（推奨）
pnpm run destroy:clean
```

### 削除コマンドの詳細

#### `pnpm run destroy`
- **機能**: AWSのCDKスタック（Lambda関数、API Gateway等）を強制削除
- **対象リソース**:
  - Lambda関数: `lambda-cdk-playground-api`
  - API Gateway: REST API とエンドポイント
  - CloudWatch ログ: `/aws/lambda/lambda-cdk-playground-api`
  - IAM ロール・ポリシー: Lambda実行用
  - Secrets Manager: API シークレット
  - SSM Parameter Store: 設定パラメータ
- **実行時間**: 約1-2分
- **注意**: 削除は不可逆的です。必要に応じてデータのバックアップを行ってください

#### `pnpm run reset`
- **機能**: CDKのローカル状態ファイルをクリーンアップ
- **削除ファイル**:
  - `cdk.out/` - CDK合成結果
  - `cdk.context.json` - CDKコンテキストキャッシュ
- **用途**: デプロイエラー解決、状態不整合の修正

#### `pnpm run destroy:clean`
- **機能**: `destroy` + `reset` を順次実行
- **推奨使用ケース**:
  - プロジェクトの完全削除
  - 開発環境のリセット
  - デプロイ問題の解決

### エラー対応ガイド

#### スタックが `UPDATE_ROLLBACK_FAILED` 状態の場合
```bash
# 強制削除を実行
pnpm run destroy

# 状態をリセット
pnpm run reset

# 新規デプロイ
pnpm run deploy
```

#### ロググループが既に存在するエラー
```bash
# 既存のスタックを完全削除
pnpm run destroy:clean

# 新規デプロイ
pnpm run deploy
```

#### CDKコンテキストの不整合
```bash
# コンテキストキャッシュをクリア
pnpm run reset

# 再度合成・デプロイ
pnpm run deploy
```

### 削除確認方法

**AWSコンソールでの確認**:
1. **CloudFormation**: スタック `LambdaCdkPlaygroundStack` が削除されていること
2. **Lambda**: 関数 `lambda-cdk-playground-api` が削除されていること
3. **API Gateway**: REST API が削除されていること
4. **CloudWatch**: ロググループが削除されていること

**コマンドラインでの確認**:
```bash
# スタックの存在確認
aws cloudformation describe-stacks --stack-name LambdaCdkPlaygroundStack

# Lambda関数の確認
aws lambda list-functions --query 'Functions[?FunctionName==`lambda-cdk-playground-api`]'
```

### トラブルシューティング

**開発サーバーが起動しない場合**:
```bash
# Lambda関数を手動ビルド
pnpm run build:lambda

# 型エラーをチェック
pnpm run lint
```

**APIが期待通りに動作しない場合**:
```bash
# テストスクリプトで動作確認
pnpm run test:lambda

# 特定のエンドポイントをテスト
curl -v http://localhost:3000/api/users
```

## 追加機能の実装

### 新しいエンドポイントを追加する場合

1. **ハンドラー作成**: `lambda/hello-world/handlers/` に新しいハンドラーを作成
2. **ルート追加**: `lambda/hello-world/routes.ts` にルートを追加
3. **CDK更新**: 必要に応じて `lib/lambda-cdk-playground-stack.ts` を更新
4. **テスト作成**: `lambda/hello-world/index.test.ts` にテストケースを追加

### 例: 新しい `/api/posts` エンドポイント

1. `lambda/hello-world/handlers/posts.ts` を作成
2. `routes.ts` に `router.get('/api/posts', getPostsHandler)` を追加
3. テストケースを追加
