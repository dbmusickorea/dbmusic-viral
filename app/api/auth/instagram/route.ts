import { NextRequest, NextResponse } from "next/server";
import { getInstagramAuthUrl } from "@/lib/instagram";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const tenantLabel = req.nextUrl.searchParams.get("tenant") ?? "default";
  const state = Buffer.from(
    JSON.stringify({ tenantLabel, nonce: crypto.randomUUID() })
  ).toString("base64url");

  return NextResponse.redirect(getInstagramAuthUrl(state));
}
