"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

const GRAPH_VERSION = "v21.0";

export async function listConnectedAccounts() {
  const { data, error } = await supabaseAdmin
    .from("connected_ig_accounts")
    .select("id, tenant_label, ig_username, ig_user_id, is_active, token_expires_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteConnectedAccount(accountId: string) {
  // FK가 on delete cascade라 이 계정에 딸린 규칙들도 같이 삭제됨
  const { error } = await supabaseAdmin
    .from("connected_ig_accounts")
    .delete()
    .eq("id", accountId);
  if (error) throw error;
  revalidatePath("/admin/ig-automation");
}

export async function listRules(connectedAccountId: string) {
  const { data, error } = await supabaseAdmin
    .from("comment_dm_rules")
    .select("*")
    .eq("connected_account_id", connectedAccountId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRecentMedia(connectedAccountId: string) {
  const { data: account, error } = await supabaseAdmin
    .from("connected_ig_accounts")
    .select("ig_user_id, access_token")
    .eq("id", connectedAccountId)
    .single();
  if (error || !account) throw new Error("계정을 찾을 수 없습니다");

  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/${account.ig_user_id}/media?fields=id,caption,permalink,timestamp&limit=15&access_token=${account.access_token}`
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`게시물 조회 실패: ${JSON.stringify(json)}`);
  return json.data as { id: string; caption?: string; permalink: string; timestamp: string }[];
}

export async function createRule(formData: {
  connectedAccountId: string;
  instagramMediaId: string;
  mediaCaption: string;
  mediaTimestamp: string;
  triggerKeyword: string;
  dmTemplate: string;
  requireFollowCheck: boolean;
}) {
  const { error } = await supabaseAdmin.from("comment_dm_rules").insert({
    connected_account_id: formData.connectedAccountId,
    instagram_media_id: formData.instagramMediaId,
    media_caption: formData.mediaCaption || null,
    media_timestamp: formData.mediaTimestamp || null,
    trigger_keyword: formData.triggerKeyword || null,
    dm_template: formData.dmTemplate,
    require_follow_check: formData.requireFollowCheck,
    is_active: true,
  });
  if (error) throw error;
  revalidatePath("/admin/ig-automation");
}

export async function toggleRuleActive(ruleId: string, isActive: boolean) {
  const { error } = await supabaseAdmin
    .from("comment_dm_rules")
    .update({ is_active: isActive })
    .eq("id", ruleId);
  if (error) throw error;
  revalidatePath("/admin/ig-automation");
}

export async function updateRule(
  ruleId: string,
  updates: { triggerKeyword: string; dmTemplate: string }
) {
  const { error } = await supabaseAdmin
    .from("comment_dm_rules")
    .update({
      trigger_keyword: updates.triggerKeyword || null,
      dm_template: updates.dmTemplate,
    })
    .eq("id", ruleId);
  if (error) throw error;
  revalidatePath("/admin/ig-automation");
}
