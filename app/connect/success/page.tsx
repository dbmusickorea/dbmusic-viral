"use client";

import Link from "next/link";

export default function ConnectSuccessPage() {
  return (
    <div className="max-w-md mx-auto mt-24 text-center px-4">
      <p className="text-2xl font-bold mb-2">계정이 연결됐어요</p>
      <p className="text-gray-500 mb-8">
        이제 이 계정의 게시물에 댓글 자동화를 설정할 수 있어요.
      </p>
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
