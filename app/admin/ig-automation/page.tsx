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
    const t = setTimeout(() => { document.title = "더블비뮤직 인스타DM"; }, 100);
    return () => clearTimeout(t);
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
