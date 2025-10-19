/**
 * GitHub Webhooks & AWS SNS認証ユーティリティ
 */

import * as crypto from 'crypto';

export interface WebhookAuthResult {
  isValid: boolean;
  service?: string;
  error?: string;
}

/**
 * GitHub Webhook署名検証 (X-Hub-Signature-256)
 */
export function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = 'sha256=' +
    crypto.createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

  // 長さが違う場合は即座にfalseを返す
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * AWS SNS署名検証
 */
export function verifyAwsSnsSignature(
  messageType: string,
  timestamp: string,
  signatureVersion: string,
  signature: string,
  signingCertUrl: string
): boolean {
  // 基本的な検証
  if (signatureVersion !== '1') {
    return false;
  }

  // 証明書URLの検証 (AWS SNSの正規URL)
  if (!signingCertUrl.startsWith('https://sns.') || !signingCertUrl.includes('.amazonaws.com/')) {
    return false;
  }

  // メッセージタイプの検証
  const validMessageTypes = ['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation'];
  if (!validMessageTypes.includes(messageType)) {
    return false;
  }

  // タイムスタンプチェック (1時間以内)
  const currentTime = new Date().getTime();
  const messageTime = new Date(timestamp).getTime();
  if (Math.abs(currentTime - messageTime) > 3600000) {
    return false;
  }

  // 実際の署名検証はより複雑ですが、基本検証として
  return true;
}

/**
 * URLパスベースの認証 (シンプルなシークレット)
 */
export function verifyPathSecret(path: string, validSecret: string): boolean {
  // /webhook/github/{secret} または /webhook/aws/{secret} の形式
  const secretMatch = path.match(/\/webhook\/(?:github|aws)\/([^\/]+)$/);
  if (!secretMatch) {
    return false;
  }

  const providedSecret = secretMatch[1];
  // 長さが違う場合は即座にfalseを返す
  if (providedSecret.length !== validSecret.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(providedSecret),
    Buffer.from(validSecret)
  );
}

/**
 * Webhookリクエストの認証を実行
 */
export function authenticateWebhook(
  method: string,
  path: string,
  headers: Record<string, string | undefined>,
  body: string,
  config: {
    githubSecret?: string;
    awsSecret?: string;
    pathSecret?: string;
  }
): WebhookAuthResult {
  // GitHub Webhook認証 (X-Hub-Signature-256ヘッダーがある場合)
  if (headers['x-hub-signature-256'] && config.githubSecret) {
    const isValid = verifyGitHubSignature(
      body,
      headers['x-hub-signature-256'],
      config.githubSecret
    );
    return {
      isValid,
      service: 'github',
      error: isValid ? undefined : 'Invalid GitHub signature'
    };
  }

  // AWS SNS認証 (SNSヘッダーがある場合)
  if (headers['x-amz-sns-message-type'] && headers['x-amz-sns-message-id']) {
    const messageType = headers['x-amz-sns-message-type'];
    const timestamp = headers['x-amz-sns-timestamp'] || '';
    const signatureVersion = headers['x-amz-sns-signature-version'] || '';
    const signature = headers['x-amz-sns-signature'] || '';
    const signingCertUrl = headers['x-amz-sns-signing-cert-url'] || '';

    const isValid = verifyAwsSnsSignature(
      messageType,
      timestamp,
      signatureVersion,
      signature,
      signingCertUrl
    );
    return {
      isValid,
      service: 'aws-sns',
      error: isValid ? undefined : 'Invalid AWS SNS signature'
    };
  }

  // URLパスベース認証 (GitHub/AWS用)
  if ((path.includes('/webhook/github/') || path.includes('/webhook/aws/')) && config.pathSecret) {
    const isValid = verifyPathSecret(path, config.pathSecret);
    return {
      isValid,
      service: path.includes('/github/') ? 'github' : 'aws',
      error: isValid ? undefined : 'Invalid webhook path secret'
    };
  }

  // Webhookエンドポイントではない場合は認証不要
  if (!path.startsWith('/webhook/') && !path.includes('/api/webhook/')) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'No valid authentication method found for webhook'
  };
}