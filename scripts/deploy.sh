#!/bin/bash

# Lambda CDK Playground デプロイスクリプト
# ビルド時環境変数を設定してCDKデプロイを実行

set -e

echo "🚀 Lambda CDK Playground デプロイ開始"

# デフォルト値の設定
export NODE_ENV=${NODE_ENV:-production}
export APP_VERSION=${APP_VERSION:-1.0.0}
export LOG_LEVEL=${LOG_LEVEL:-info}
export ENABLE_ANALYTICS=${ENABLE_ANALYTICS:-false}
export DEBUG=${DEBUG:-false}

# 機能フラグのデフォルト値
export ENABLE_WEBHOOKS=${ENABLE_WEBHOOKS:-false}
export ENABLE_RATE_LIMIT=${ENABLE_RATE_LIMIT:-true}
export ENABLE_LOGGING=${ENABLE_LOGGING:-true}
export MAX_REQUESTS_PER_MINUTE=${MAX_REQUESTS_PER_MINUTE:-100}

# 外部API設定のデフォルト値
export EXTERNAL_API_BASE_URL=${EXTERNAL_API_BASE_URL:-https://api.example.com}
export API_TIMEOUT=${API_TIMEOUT:-30000}
export API_RETRIES=${API_RETRIES:-3}

# Git情報の自動取得（利用可能な場合）
if [ -d ".git" ]; then
  export GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
  export GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
fi

# デプロイID（タイムスタンプベース）
export DEPLOYMENT_ID=${DEPLOYMENT_ID:-$(date +%Y%m%d-%H%M%S)}

# 設定値の表示
echo "📋 デプロイ設定:"
echo "   NODE_ENV: $NODE_ENV"
echo "   APP_VERSION: $APP_VERSION"
echo "   ENABLE_WEBHOOKS: $ENABLE_WEBHOOKS"
echo "   ENABLE_RATE_LIMIT: $ENABLE_RATE_LIMIT"
echo "   GIT_COMMIT: ${GIT_COMMIT:0:8}..."
echo "   GIT_BRANCH: $GIT_BRANCH"
echo "   DEPLOYMENT_ID: $DEPLOYMENT_ID"

# WebHook URLsの存在確認（設定されている場合のみ表示）
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
  echo "   SLACK_WEBHOOK_URL: 設定済み"
fi
if [ ! -z "$DISCORD_WEBHOOK_URL" ]; then
  echo "   DISCORD_WEBHOOK_URL: 設定済み"
fi
if [ ! -z "$TEAMS_WEBHOOK_URL" ]; then
  echo "   TEAMS_WEBHOOK_URL: 設定済み"
fi
if [ ! -z "$GENERIC_WEBHOOK_URL" ]; then
  echo "   GENERIC_WEBHOOK_URL: 設定済み"
fi

echo ""

# 依存関係のインストール
echo "📦 依存関係のインストール中..."
pnpm install

# TypeScriptのビルド
echo "🔨 TypeScriptのビルド中..."
pnpm run build

# CDKのブートストラップ（初回デプロイ時のみ必要）
if [ "$1" = "--bootstrap" ]; then
  echo "🏗️  CDKブートストラップ実行中..."
  pnpx cdk bootstrap
fi

# CDKデプロイの実行
echo "☁️  CDKデプロイ実行中..."
pnpx cdk deploy

echo "✅ デプロイ完了!"
echo ""
echo "🔗 API Gateway URL は上記の出力から確認してください"
echo "📝 ログの確認: aws logs tail /aws/lambda/LambdaCdkPlaygroundStack-HelloWorldFunction --follow"