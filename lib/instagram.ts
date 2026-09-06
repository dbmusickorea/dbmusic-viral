const GRAPH_VERSION = "v21.0";

export function getInstagramAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
    scope:
      "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
    response_type: "code",
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForShortLivedToken(code: string) {
  const body = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`단기 토큰 교환 실패: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; user_id: string }>;
}

export async function exchangeForLongLivedToken(shortLivedToken: string) {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    access_token: shortLivedToken,
  });
  const res = await fetch(
    `https://graph.instagram.com/access_token?${params.toString()}`
  );
  if (!res.ok) throw new Error(`장기 토큰 교환 실패: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function getInstagramProfile(accessToken: string) {
  const res = await fetch(
    `https://graph.instagram.com/me?fields=user_id,username&access_token=${accessToken}`
  );
  if (!res.ok) throw new Error(`프로필 조회 실패: ${await res.text()}`);
  return res.json() as Promise<{ user_id: string; username: string }>;
}

// 이 계정 앞으로 webhook 알림(댓글 등)이 실제로 오도록 활성화하는 호출
// 계정 연결(OAuth) 직후 반드시 한 번 호출해야 함 - 안 하면 앱 대시보드에서 comments 필드를
// 구독해도 이 특정 계정에서 일어난 일은 webhook으로 안 옴
export async function enableWebhookSubscription(accessToken: string) {
  const params = new URLSearchParams({
    subscribed_fields: "comments,messages",
    access_token: accessToken,
  });
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/subscribed_apps?${params.toString()}`,
    { method: "POST" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`webhook 구독 활성화 실패: ${JSON.stringify(data)}`);
  return data;
}

export async function sendPrivateReply(
  accessToken: string,
  commentId: string,
  text: string
) {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/messages?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`DM 발송 실패: ${JSON.stringify(data)}`);
  return data;
}


export async function sendFollowGatePrivateReply(
  accessToken: string,
  commentId: string,
  promptText: string
) {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/messages?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: {
          text: promptText,
          quick_replies: [
            { content_type: "text", title: "팔로우 확인", payload: "FOLLOW_CHECK" },
          ],
        },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`팔로우 확인 DM 발송 실패: ${JSON.stringify(data)}`);
  return data;
}

export async function sendDirectMessage(
  accessToken: string,
  igsid: string,
  text: string,
  withFollowButton = false
) {
  const message: any = { text };
  if (withFollowButton) {
    message.quick_replies = [
      { content_type: "text", title: "팔로우 확인", payload: "FOLLOW_CHECK" },
    ];
  }
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/me/messages?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: igsid }, message }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`DM 발송 실패: ${JSON.stringify(data)}`);
  return data;
}

export async function checkUserFollowsBusiness(accessToken: string, igsid: string) {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_VERSION}/${igsid}?fields=is_user_follow_business&access_token=${accessToken}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`팔로우 상태 조회 실패: ${JSON.stringify(data)}`);
  return data.is_user_follow_business === true;
}
