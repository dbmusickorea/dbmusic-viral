"use client";

import { useMemo, useState, useTransition } from "react";
import {
  listRules,
  fetchRecentMedia,
  createRule,
  toggleRuleActive,
  updateRule,
  deleteConnectedAccount,
} from "./actions";

const ACCENT = "#F0472F";

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
  media_timestamp: string | null;
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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        {children}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-lg bg-gray-100 text-gray-700 font-medium"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-6 rounded-full relative transition-colors ${
        on ? "" : "bg-gray-300"
      }`}
      style={on ? { backgroundColor: ACCENT } : undefined}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          on ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

export default function RuleManager({
  initialAccounts,
  initialRules,
}: {
  initialAccounts: Account[];
  initialRules: Rule[];
}) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState(
    initialAccounts[0]?.id ?? ""
  );
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [sortMode, setSortMode] = useState<"latest" | "post">("latest");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenantLabel, setNewTenantLabel] = useState("");

  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [template, setTemplate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState("");
  const [editTemplate, setEditTemplate] = useState("");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const sortedRules = useMemo(() => {
    const copy = [...rules];
    if (sortMode === "post") {
      copy.sort((a, b) => {
        const ta = a.media_timestamp ? new Date(a.media_timestamp).getTime() : 0;
        const tb = b.media_timestamp ? new Date(b.media_timestamp).getTime() : 0;
        return tb - ta;
      });
    }
    return copy;
  }, [rules, sortMode]);

  async function loadRules(accountId: string) {
    setSelectedAccountId(accountId);
    const data = await listRules(accountId);
    setRules(data as Rule[]);
  }

  function handleConnectAccount() {
    const label = newTenantLabel.trim();
    if (!label) {
      setError("레이블/기획사명을 입력하세요");
      return;
    }
    window.location.href = `/api/auth/instagram?tenant=${encodeURIComponent(label)}`;
  }

  function handleReconnect(tenantLabel: string) {
    window.location.href = `/api/auth/instagram?tenant=${encodeURIComponent(tenantLabel)}`;
  }

  function handleDeleteAccount(accountId: string) {
    if (!confirm("이 계정 연동을 삭제하시겠어요? 등록된 자동화 규칙도 함께 삭제됩니다.")) return;
    startTransition(async () => {
      await deleteConnectedAccount(accountId);
      const remaining = accounts.filter((a) => a.id !== accountId);
      setAccounts(remaining);
      if (remaining.length > 0) {
        await loadRules(remaining[0].id);
      } else {
        setRules([]);
        setSelectedAccountId("");
      }
    });
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
    const media = mediaList.find((m) => m.id === selectedMediaId);
    setError("");
    startTransition(async () => {
      try {
        await createRule({
          connectedAccountId: selectedAccountId,
          instagramMediaId: selectedMediaId,
          mediaCaption: media?.caption ?? "",
          mediaTimestamp: media?.timestamp ?? "",
          triggerKeyword: keyword,
          dmTemplate: template,
        });
        setTemplate("");
        setKeyword("");
        setSelectedMediaId("");
        setMediaList([]);
        setShowAddModal(false);
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

  function saveEdit(ruleId: string) {
    startTransition(async () => {
      await updateRule(ruleId, { triggerKeyword: editKeyword, dmTemplate: editTemplate });
      setEditingId(null);
      await loadRules(selectedAccountId);
    });
  }

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* 상단 계정 전환 바 */}
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <button
          type="button"
          onClick={() => setShowAccountModal(true)}
          className="flex items-center gap-1 font-bold text-lg"
        >
          {selectedAccount ? `@${selectedAccount.ig_username}` : "연결된 계정 없음"}
          <span className="text-sm text-gray-400">⌄</span>
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* 안내 배너 */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
          게시물에 댓글이 달리면 자동으로 DM을 보내드려요
        </div>

        {/* 탭 */}
        <div className="bg-gray-100 rounded-lg p-1 flex text-sm">
          <div
            className="flex-1 text-center py-2 rounded-md bg-white font-semibold"
            style={{ color: ACCENT }}
          >
            DM 자동화
          </div>
          <div className="flex-1 text-center py-2 text-gray-400">이벤트 추첨</div>
        </div>

        {/* 개수 + 추가 버튼 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">총 {rules.length}개</span>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={!selectedAccountId}
            className="text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}
          >
            + 자동화 추가하기
          </button>
        </div>

        {/* 정렬 */}
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => setSortMode("post")}
            className={sortMode === "post" ? "font-bold" : "text-gray-400"}
          >
            게시물 순
          </button>
          <button
            type="button"
            onClick={() => setSortMode("latest")}
            className={sortMode === "latest" ? "font-bold" : "text-gray-400"}
          >
            최신 순
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* 목록 */}
        {sortedRules.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            아직 자동화된 게시물이 없어요
            <div className="mt-1">댓글에 자동으로 DM을 보내 팔로워를 고객으로 전환해보세요</div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRules.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <div key={r.id} className="border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate max-w-[70%]" title={r.instagram_media_id}>
                      {r.media_caption ?? r.instagram_media_id}
                    </span>
                    <Toggle on={r.is_active} onClick={() => handleToggle(r.id, r.is_active)} />
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        className="border rounded px-3 py-2 w-full text-sm"
                        value={editKeyword}
                        onChange={(e) => setEditKeyword(e.target.value)}
                        placeholder="키워드 (비우면 전체 댓글)"
                      />
                      <textarea
                        className="border rounded px-3 py-2 w-full text-sm"
                        rows={2}
                        value={editTemplate}
                        onChange={(e) => setEditTemplate(e.target.value)}
                      />
                      <div className="flex gap-3 text-sm">
                        <button
                          type="button"
                          className="font-semibold"
                          style={{ color: ACCENT }}
                          onClick={() => saveEdit(r.id)}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          className="text-gray-400"
                          onClick={() => setEditingId(null)}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="truncate max-w-[75%]">
                        {r.trigger_keyword ? `"${r.trigger_keyword}" → ` : "전체 댓글 → "}
                        {r.dm_template}
                      </span>
                      <button
                        type="button"
                        className="text-xs font-medium"
                        style={{ color: ACCENT }}
                        onClick={() => startEdit(r)}
                      >
                        수정
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 계정 관리 모달 */}
      {showAccountModal && (
        <Modal title="인스타그램 연동 관리" onClose={() => setShowAccountModal(false)}>
          <div className="space-y-3">
            {accounts.map((a) => (
              <div key={a.id} className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="font-medium text-left"
                    onClick={() => {
                      loadRules(a.id);
                      setShowAccountModal(false);
                    }}
                  >
                    @{a.ig_username}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(a.id)}
                    className="text-gray-400 hover:text-red-600 text-sm"
                  >
                    삭제
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  기능이 정상 동작하지 않으면 다시 연동할 수 있어요
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold mt-1"
                  style={{ color: ACCENT }}
                  onClick={() => handleReconnect(a.tenant_label)}
                >
                  다시 연동하기
                </button>
              </div>
            ))}

            <div className="border-t pt-3 space-y-2">
              <p className="text-sm font-medium">새 계정 연결</p>
              <p className="text-xs text-gray-400">
                인스타그램 아이디가 아니라, 내부에서 구분할 이름표예요. 실제 로그인은 다음 화면에서 진행돼요.
              </p>
              <input
                className="border rounded px-3 py-2 w-full text-sm"
                placeholder="레이블/기획사명 (예: 오늘의스케줄)"
                value={newTenantLabel}
                onChange={(e) => setNewTenantLabel(e.target.value)}
              />
              <button
                type="button"
                onClick={handleConnectAccount}
                className="w-full py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: ACCENT }}
              >
                인스타그램으로 로그인
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 자동화 추가 모달 */}
      {showAddModal && (
        <Modal title="자동화 추가하기" onClose={() => setShowAddModal(false)}>
          <div className="space-y-3">
            <button
              type="button"
              className="text-sm font-medium"
              style={{ color: ACCENT }}
              onClick={handleLoadMedia}
              disabled={isPending}
            >
              최근 게시물 불러오기
            </button>

            {mediaList.length > 0 && (
              <select
                className="border rounded px-3 py-2 w-full text-sm"
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
              className="border rounded px-3 py-2 w-full text-sm"
              placeholder="트리거 키워드 (비우면 모든 댓글에 반응)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <textarea
              className="border rounded px-3 py-2 w-full text-sm"
              placeholder="보낼 DM 내용"
              rows={3}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />

            <button
              type="button"
              onClick={handleCreateRule}
              disabled={isPending}
              className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-40"
              style={{ backgroundColor: ACCENT }}
            >
              저장
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
