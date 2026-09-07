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
    let count = 0;
    const interval = setInterval(() => {
      if (document.title !== desired) document.title = desired;
      count += 1;
      if (count > 25) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
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
