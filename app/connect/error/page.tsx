"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ErrorContent() {
  const params = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <p className="text-2xl font-bold mb-2">연결에 실패했어요</p>
      <p className="text-gray-500 mb-2">
        계정 연결 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.
      </p>
      {reason && <p className="text-xs text-gray-400 mb-8">사유: {reason}</p>}
      <Link
        href="/admin/ig-automation"
        className="inline-block px-6 py-3 rounded-lg text-white font-semibold"
        style={{ backgroundColor: "#F0472F" }}
      >
        자동화 관리로 돌아가기
      </Link>
    </div>
  );
}

export default function ConnectErrorPage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent />
    </Suspense>
  );
}
