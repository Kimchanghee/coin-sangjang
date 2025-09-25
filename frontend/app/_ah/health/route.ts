import { NextResponse } from "next/server";

import { buildHealthPayload } from "@/lib/health";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(buildHealthPayload());
}

export function HEAD() {
  return new Response(null, { status: 200 });
}
