import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sendPrivateReply } from "@/lib/instagram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.INSTAGRAM_APP_SECRET!)
      .update(rawBody)
      .digest("hex");
  if (signature !== expected) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      await handleComment(change.value, entry.id);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleComment(comment: any, igAccountId: string) {
  const { id: commentId, media, text, from } = comment;

  if (from?.id === igAccountId) return;

  const { data: account } = await supabase
    .from("connected_ig_accounts")
    .select("id, access_token")
    .eq("ig_user_id", igAccountId)
    .eq("is_active", true)
    .maybeSingle();
  if (!account) return;

  const { data: rules } = await supabase
    .from("comment_dm_rules")
    .select("*")
    .eq("connected_account_id", account.id)
    .eq("instagram_media_id", media?.id)
    .eq("is_active", true);

  const matchedRule = (rules ?? []).find(
    (rule) => !rule.trigger_keyword || text?.includes(rule.trigger_keyword)
  );
  if (!matchedRule) return;

  try {
    await sendPrivateReply(
      account.access_token,
      commentId,
      matchedRule.dm_template
    );
    await supabase.from("dm_send_logs").insert({
      rule_id: matchedRule.id,
      comment_id: commentId,
      commenter_ig_id: from?.id,
      status: "sent",
    });
  } catch (err: any) {
    await supabase.from("dm_send_logs").insert({
      rule_id: matchedRule.id,
      comment_id: commentId,
      commenter_ig_id: from?.id,
      status: "failed",
      error_message: err.message,
    });
  }
}
