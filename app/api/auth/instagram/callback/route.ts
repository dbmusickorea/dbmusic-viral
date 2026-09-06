import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  getInstagramProfile,
} from "@/lib/instagram";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/connect/error?reason=missing_code", req.url)
    );
  }

  const { tenantLabel } = JSON.parse(
    Buffer.from(state, "base64url").toString()
  );

  try {
    const shortLived = await exchangeCodeForShortLivedToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    const profile = await getInstagramProfile(longLived.access_token);

    const expiresAt = new Date(
      Date.now() + longLived.expires_in * 1000
    ).toISOString();

    const { error } = await supabase.from("connected_ig_accounts").upsert(
      {
        tenant_label: tenantLabel,
        ig_user_id: profile.user_id,
        ig_username: profile.username,
        access_token: longLived.access_token,
        token_expires_at: expiresAt,
        is_active: true,
      },
      { onConflict: "ig_user_id" }
    );

    if (error) throw error;

    return NextResponse.redirect(new URL("/connect/success", req.url));
  } catch (err) {
    console.error("Instagram OAuth 콜백 오류:", err);
    return NextResponse.redirect(new URL("/connect/error", req.url));
  }
}
