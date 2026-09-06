"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listConnectedAccounts, listRules } from "./actions";
import RuleManager from "./RuleManager";

export default function IgAutomationPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [initialRules, setInitialRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "admin") {
      router.push("/");
      return;
    }
    setAuthorized(true);

    const loadData = async () => {
      const accountsData = await listConnectedAccounts();
      setAccounts(accountsData);
      if (accountsData.length > 0) {
        const rulesData = await listRules(accountsData[0].id);
        setInitialRules(rulesData);
      }
      setLoading(false);
    };
    loadData();
  }, [router]);

  if (!authorized || loading) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">인스타그램 댓글→DM 자동화</h1>
      {accounts.length === 0 ? (
        <p className="text-gray-500">
          연결된 계정이 없습니다. 먼저 /api/auth/instagram 으로 계정을 연결하세요.
        </p>
      ) : (
        <RuleManager accounts={accounts} initialRules={initialRules} />
      )}
    </div>
  );
}
