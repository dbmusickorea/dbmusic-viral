import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import {
  sendPrivateReply,
  sendFollowGatePrivateReply,
  sendDirectMessage,
  checkUserFollowsBusiness,
} from "@/lib/instagram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", process.env.INSTAGRAM_APP_SECRET!).update(rawBody).digest("hex");
  if (signature !== expected) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      await handleComment(change.value, entry.id);
    }
    for (const messaging of entry.messaging ?? []) {
      await handleMessage(messaging, entry.id);
    }
  }

  return NextResponse.json({ received: true });
}

async function getAccount(igAccountId: string) {
  const { data } = await supabase
    .from("connected_ig_accounts")
    .select("id, access_token")
    .eq("ig_user_id", igAccountId)
    .eq("is_active", true)
    .maybeSingle();
  return data;
}

async function handleComment(comment: any, igAccountId: string) {
  const { id: commentId, media, text, from } = comment;
  if (from?.id === igAccountId) return;

  const account = await getAccount(igAccountId);
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
    if (matchedRule.require_follow_check) {
      await sendFollowGatePrivateReply(
        account.access_token,
        commentId,
        "게시글 확인 감사해요! 팔로우 확인 후 안내 DM을 보내드릴게요 🙌"
      );
      await supabase.from("follow_gate_pending").insert({
        connected_account_id: account.id,
        commenter_ig_id: from?.id,
        rule_id: matchedRule.id,
      });
      await supabase.from("dm_send_logs").insert({
        rule_id: matchedRule.id,
        comment_id: commentId,
        commenter_ig_id: from?.id,
        status: "sent",
      });
    } else {
      await sendPrivateReply(account.access_token, commentId, matchedRule.dm_template);
      await supabase.from("dm_send_logs").insert({
        rule_id: matchedRule.id,
        comment_id: commentId,
        commenter_ig_id: from?.id,
        status: "sent",
      });
    }
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

async function handleMessage(messaging: any, igAccountId: string) {
  const senderId = messaging.sender?.id;
  const payload = messaging.message?.quick_reply?.payload;
  if (!senderId || payload !== "FOLLOW_CHECK") return;

  const account = await getAccount(igAccountId);
  if (!account) return;

  const { data: pending } = await supabase
    .from("follow_gate_pending")
    .select("*")
    .eq("connected_account_id", account.id)
    .eq("commenter_ig_id", senderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pending) return;

  const { data: rule } = await supabase
    .from("comment_dm_rules")
    .select("*")
    .eq("id", pending.rule_id)
    .maybeSingle();
  if (!rule) return;

  const logId = messaging.message?.mid ?? "follow-check";

  try {
    const isFollowing = await checkUserFollowsBusiness(account.access_token, senderId);

    if (isFollowing) {
      await sendDirectMessage(account.access_token, senderId, rule.dm_template);
      await supabase.from("follow_gate_pending").delete().eq("id", pending.id);
      await supabase.from("dm_send_logs").insert({
        rule_id: rule.id,
        comment_id: logId,
        commenter_ig_id: senderId,
        status: "sent",
      });
    } else {
      await sendDirectMessage(
        account.access_token,
        senderId,
        "아직 팔로우가 확인되지 않았어요. 팔로우 후 다시 눌러주세요!",
        true
      );
    }
  } catch (err: any) {
    await supabase.from("dm_send_logs").insert({
      rule_id: rule.id,
      comment_id: logId,
      commenter_ig_id: senderId,
      status: "failed",
      error_message: err.message,
    });
  }
}
