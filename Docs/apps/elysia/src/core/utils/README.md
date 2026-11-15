# src/core/utils

## Modules

| Module | Role | Routes | Exports |
| :--- | :--- | :--- | :--- |
| [auth-crypto.ts](./auth-crypto.md) ([[core/utils/auth-crypto]]) | Core Infrastructure | 0 | `hashPassword`, `hashApiKey`, `generateBackupCodes`, `verifyBackupCode` |
| [cache.ts](./cache.md) ([[core/utils/cache]]) | Core Infrastructure | 0 | `cache`, `CacheInstance` |
| [domain.ts](./domain.md) ([[core/utils/domain]]) | Core Infrastructure | 0 | `getDomainConfig` |
| [network.ts](./network.md) ([[core/utils/network]]) | Core Infrastructure | 0 | `isPrivateOrLoopbackIp`, `normalizeIpAddress`, `extractTrustedClientIp`, `assertSafeExternalUrl` |
| [oauth.ts](./oauth.md) ([[core/utils/oauth]]) | Core Infrastructure | 0 | `SUPPORTED_SCOPES`, `IrisScope`, `parseScopes`, `generateClientId` |
| [s3.ts](./s3.md) ([[core/utils/s3]]) | Core Infrastructure | 0 | `PUBLIC_BUCKET`, `ENCRYPTED_BUCKET`, `s3Client`, `ensurePublicBucketExists` |
