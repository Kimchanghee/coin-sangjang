import { ConfigService } from '@nestjs/config';

const DEFAULT_JWT_SECRET = 'change-me-in-production';

export function resolveJwtSecret(config: ConfigService): string {
  const providedSecret =
    config.get<string>('AUTH_JWT_SECRET') ?? config.get<string>('JWT_SECRET');

  if (providedSecret && providedSecret.trim().length > 0) {
    return providedSecret;
  }

  const fallbackSecret = DEFAULT_JWT_SECRET;

  const environment = config.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
  const envLabel = environment ?? 'unknown';

  console.warn(
    `AUTH_JWT_SECRET is not configured. Falling back to a default secret (env: ${envLabel}). ` +
      'This is insecure and should only be used for development. Please set AUTH_JWT_SECRET in the environment.',
  );

  return fallbackSecret;
}
