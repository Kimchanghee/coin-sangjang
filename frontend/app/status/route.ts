import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({
    service: 'coin-sangjang',
    status: 'running',
    mode: process.env.ENABLE_TEST_MODE === 'true' ? 'test' : 'production',
    autoTrading: process.env.ENABLE_AUTO_TRADING === 'true',
    monitoring: {
      upbit: { status: 'active', checkInterval: '30s' },
      bithumb: { status: 'active', checkInterval: '30s' },
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
    },
  });
}
