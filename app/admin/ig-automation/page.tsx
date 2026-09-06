import { listConnectedAccounts, listRules } from "./actions";
import RuleManager from "./RuleManager";

export default async function IgAutomationPage() {
  const accounts = await listConnectedAccounts();
  const initialRules = accounts.length > 0 ? await listRules(accounts[0].id) : [];

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
