import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({
    name: 'Coin Sangjang API',
    version: '1.0.0',
    endpoints: [
      '/ - Main UI',
      '/health - Health check',
      '/api - API information',
      '/status - Service status',
    ],
  });
}
