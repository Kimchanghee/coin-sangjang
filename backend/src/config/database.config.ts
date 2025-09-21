import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

function isNonEmpty(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function shouldSynchronizeSchemas(environment: string): boolean {
  return environment !== 'production';
}

function shouldUseSsl(url?: string | null): boolean {
  if (process.env.DB_SSL === 'true') {
    return true;
  }

  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    const sslMode = parsed.searchParams.get('sslmode');
    return Boolean(sslMode && sslMode.toLowerCase() !== 'disable');
  } catch {
    return false;
  }
}

export function resolveDatabaseConfig(): TypeOrmModuleOptions | null {
  const environment = process.env.NODE_ENV ?? 'development';
  const synchronize = shouldSynchronizeSchemas(environment);

  const databaseUrl = process.env.DATABASE_URL ?? process.env.DB_URL;
  if (isNonEmpty(databaseUrl)) {
    return {
      type: 'postgres',
      url: databaseUrl,
      autoLoadEntities: true,
      synchronize,
      ssl: shouldUseSsl(databaseUrl)
        ? { rejectUnauthorized: false }
        : undefined,
    } satisfies TypeOrmModuleOptions;
  }

  const explicitHost = process.env.DB_HOST ?? process.env.PGHOST;
  const host = isNonEmpty(explicitHost)
    ? explicitHost
    : environment === 'production'
      ? undefined
      : 'localhost';

  if (!host) {
    console.warn(
      'Database host was not provided. Skipping database initialization.',
    );
    return null;
  }

  const username =
    process.env.DB_USER ??
    process.env.PGUSER ??
    (environment === 'production' ? undefined : 'postgres');
  const password =
    process.env.DB_PASSWORD ??
    process.env.PGPASSWORD ??
    (environment === 'production' ? undefined : 'postgres');
  const database =
    process.env.DB_NAME ??
    process.env.PGDATABASE ??
    (environment === 'production' ? undefined : 'coin_sangjang');

  if (!isNonEmpty(username) || !isNonEmpty(password) || !isNonEmpty(database)) {
    console.warn(
      'Database credentials are incomplete. Skipping database initialization.',
    );
    return null;
  }

  const port = Number(process.env.DB_PORT ?? process.env.PGPORT ?? 5432);

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    autoLoadEntities: true,
    synchronize,
    ssl:
      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  } satisfies TypeOrmModuleOptions;
}
