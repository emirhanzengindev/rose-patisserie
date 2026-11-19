import { NextResponse, type NextRequest } from "next/server";
import { keepalive } from "@/lib/keepalive";
import { createPublicSupabase } from "@/lib/supabase/public";

// Vercel Cron, CRON_SECRET tanımlıysa isteğe `Authorization: Bearer <CRON_SECRET>` ekler.
export async function GET(request: NextRequest) {
  const result = await keepalive(request.headers.get("authorization"), process.env.CRON_SECRET, createPublicSupabase());
  return NextResponse.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
