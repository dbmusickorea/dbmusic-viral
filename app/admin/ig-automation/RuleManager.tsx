"use client";

import { useState, useTransition } from "react";
import {
  listRules,
  fetchRecentMedia,
  createRule,
  toggleRuleActive,
  updateRule,
} from "./actions";

type Account = {
  id: string;
  tenant_label: string;
  ig_username: string;
  ig_user_id: string;
  is_active: boolean;
  token_expires_at: string;
};

type Rule = {
  id: string;
  instagram_media_id: string;
  media_caption: string | null;
  trigger_keyword: string | null;
  dm_template: string;
  is_active: boolean;
};

type Media = {
  id: string;
  caption?: string;
  permalink: string;
  timestamp: string;
};

export default function RuleManager({
  accounts,
  initialRules,
}: {
  accounts: Account[];
  initialRules: Rule[];
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [template, setTemplate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [newTenantLabel, setNewTenantLabel] = useState("");

  // 인라인 수정 중인 규칙 id와 그 draft 값
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState("");
  const [editTemplate, setEditTemplate] = useState("");

  function handleConnectAccount() {
    const label = newTenantLabel.trim();
    if (!label) {
      setError("레이블/기획사명을 입력하세요");
      return;
    }
    window.location.href = `/api/auth/instagram?tenant=${encodeURIComponent(label)}`;
  }

  async function loadRules(accountId: string) {
    setSelectedAccountId(accountId);
    const data = await listRules(accountId);
    setRules(data as Rule[]);
    setMediaList([]);
    setSelectedMediaId("");
  }

  function handleLoadMedia() {
    setError("");
    startTransition(async () => {
      try {
        const data = await fetchRecentMedia(selectedAccountId);
        setMediaList(data);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  function handleCreateRule() {
    if (!selectedMediaId || !template) {
      setError("게시물과 DM 내용은 필수입니다");
      return;
    }
    const selectedMedia = mediaList.find((m) => m.id === selectedMediaId);
    setError("");
    startTransition(async () => {
      try {
        await createRule({
          connectedAccountId: selectedAccountId,
          instagramMediaId: selectedMediaId,
          mediaCaption: selectedMedia?.caption ?? "",
          triggerKeyword: keyword,
          dmTemplate: template,
        });
        setTemplate("");
        setKeyword("");
        await loadRules(selectedAccountId);
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  function handleToggle(ruleId: string, current: boolean) {
    startTransition(async () => {
      await toggleRuleActive(ruleId, !current);
      await loadRules(selectedAccountId);
    });
  }

  function startEdit(rule: Rule) {
    setEditingId(rule.id);
    setEditKeyword(rule.trigger_keyword ?? "");
    setEditTemplate(rule.dm_template);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(ruleId: string) {
    startTransition(async () => {
      await updateRule(ruleId, {
        triggerKeyword: editKeyword,
        dmTemplate: editTemplate,
      });
      setEditingId(null);
      await loadRules(selectedAccountId);
    });
  }

  return (
    <div className="space-y-6">
      <div className="border rounded p-4 space-y-2 bg-gray-50">
        <h2 className="font-semibold">새 계정 연결</h2>
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="레이블/기획사명 (예: 오늘의스케줄)"
          value={newTenantLabel}
          onChange={(e) => setNewTenantLabel(e.target.value)}
        />
        <button
          type="button"
          className="bg-blue-600 text-white rounded px-4 py-2"
          onClick={handleConnectAccount}
        >
          인스타그램으로 로그인
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">계정 선택</label>
        <select
          className="border rounded px-3 py-2 w-full"
          value={selectedAccountId}
          onChange={(e) => loadRules(e.target.value)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.tenant_label} ({a.ig_username})
            </option>
          ))}
        </select>
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">새 규칙 추가</h2>

        <button
          type="button"
          className="text-sm text-blue-600 underline"
          onClick={handleLoadMedia}
          disabled={isPending}
        >
          최근 게시물 불러오기
        </button>

        {mediaList.length > 0 && (
          <select
            className="border rounded px-3 py-2 w-full"
            value={selectedMediaId}
            onChange={(e) => setSelectedMediaId(e.target.value)}
          >
            <option value="">게시물 선택</option>
            {mediaList.map((m) => (
              <option key={m.id} value={m.id}>
                {(m.caption ?? "(캡션 없음)").slice(0, 40)} —{" "}
                {new Date(m.timestamp).toLocaleDateString()}
              </option>
            ))}
          </select>
        )}

        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="트리거 키워드 (비우면 모든 댓글에 반응)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <textarea
          className="border rounded px-3 py-2 w-full"
          placeholder="보낼 DM 내용"
          rows={3}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="button"
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
          onClick={handleCreateRule}
          disabled={isPending}
        >
          규칙 저장
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-2">등록된 규칙</h2>
        {rules.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 규칙이 없습니다</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">게시물</th>
                <th>키워드</th>
                <th>DM 내용</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const isEditing = editingId === r.id;
                return (
                  <tr key={r.id} className="border-b align-top">
                    <td className="py-2 max-w-[160px]">
                      <span title={r.instagram_media_id}>
                        {(r.media_caption ?? r.instagram_media_id).slice(0, 30)}
                      </span>
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={editKeyword}
                          onChange={(e) => setEditKeyword(e.target.value)}
                          placeholder="(전체)"
                        />
                      ) : (
                        r.trigger_keyword ?? "(전체)"
                      )}
                    </td>
                    <td className="max-w-xs">
                      {isEditing ? (
                        <textarea
                          className="border rounded px-2 py-1 w-full"
                          rows={2}
                          value={editTemplate}
                          onChange={(e) => setEditTemplate(e.target.value)}
                        />
                      ) : (
                        <span className="truncate block">{r.dm_template}</span>
                      )}
                    </td>
                    <td>{r.is_active ? "활성" : "비활성"}</td>
                    <td className="space-x-2 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="text-green-600 underline text-xs"
                            onClick={() => saveEdit(r.id)}
                            disabled={isPending}
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            className="text-gray-500 underline text-xs"
                            onClick={cancelEdit}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="text-blue-600 underline text-xs"
                            onClick={() => startEdit(r)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="text-blue-600 underline text-xs"
                            onClick={() => handleToggle(r.id, r.is_active)}
                            disabled={isPending}
                          >
                            {r.is_active ? "끄기" : "켜기"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
