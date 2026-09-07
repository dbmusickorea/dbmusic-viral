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
    const desired = "더블비뮤직 인스타DM";
    document.title = desired;
    const titleEl = document.querySelector("title");
    if (!titleEl) return;
    const observer = new MutationObserver(() => {
      if (document.title !== desired) document.title = desired;
    });
    observer.observe(titleEl, { childList: true });
    return () => observer.disconnect();
  }, []);

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

  return <RuleManager initialAccounts={accounts} initialRules={initialRules} />;
}
