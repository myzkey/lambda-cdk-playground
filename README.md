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

## セットアップ

1. 依存関係のインストール：

```bash
pnpm install
```

1. プロジェクトのビルド：

```bash
pnpm run build
```

1. CloudFormationテンプレートの生成：

```bash
pnpm run synth
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

- `https://your-api-id.execute-api.region.amazonaws.com/prod/` - Hello World
- `https://your-api-id.execute-api.region.amazonaws.com/prod/hello` - Hello World
- `https://your-api-id.execute-api.region.amazonaws.com/prod/hello?name=Alice` - Hello Alice

## 利用可能なコマンド

- `pnpm run build` - TypeScriptをJavaScriptにコンパイル
- `pnpm run build:lambda` - Lambda関数のみをビルド
- `pnpm run watch` - ファイル変更を監視してコンパイル
- `pnpm run test` - Jest単体テストを実行
- `pnpm run synth` - CloudFormationテンプレートを生成
- `pnpm run deploy` - スタックをAWSにデプロイ
- `pnpm cdk diff` - デプロイされたスタックと現在の状態を比較
- `pnpm cdk destroy` - スタックを削除

## Lambda関数について

`lambda/hello-world/index.ts`のLambda関数は：

- API Gateway Proxyイベントを受け取る
- クエリパラメータ`name`をチェック
- JSON形式でレスポンスを返す
- CORS設定済み
- リクエストID、タイムスタンプを含む

## 追加機能の実装

新しいLambda関数を追加する場合：

- `lambda/`ディレクトリに新しいフォルダを作成
- `lib/lambda-cdk-playground-stack.ts`にLambda関数とAPI Gatewayルートを追加
- 必要に応じてテストを作成
