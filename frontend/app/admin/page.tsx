"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface AdminPortalRequest {
  id: string;
  uid: string;
  exchange: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  memo?: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string | null;
}

export default function AdminPortalPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [portalPassword, setPortalPassword] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [requests, setRequests] = useState<AdminPortalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080/api",
    [],
  );

  const authenticated = portalPassword !== null;

  const fetchRequests = useCallback(async () => {
    if (!portalPassword) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/admin/portal/requests`, {
        headers: { "x-admin-password": portalPassword },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as AdminPortalRequest[];
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[admin-portal] 목록 조회 실패", error);
      setActionMessage("요청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [apiBase, portalPassword]);

  useEffect(() => {
    if (authenticated) {
      void fetchRequests();
    }
  }, [authenticated, fetchRequests]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError(null);
    try {
      const response = await fetch(`${apiBase}/admin/portal/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setPortalPassword(passwordInput);
      setPasswordInput("");
    } catch (error) {
      console.error("[admin-portal] 로그인 실패", error);
      setLoginError("비밀번호가 올바르지 않습니다.");
    }
  };

  const approveRequest = async (requestId: string) => {
    if (!portalPassword) {
      return;
    }
    try {
      const response = await fetch(
        `${apiBase}/admin/portal/requests/${requestId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": portalPassword,
          },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setActionMessage("승인 완료");
      await fetchRequests();
    } catch (error) {
      console.error("[admin-portal] 승인 실패", error);
      setActionMessage("승인 처리에 실패했습니다.");
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!portalPassword) {
      return;
    }
    const memo = window.prompt("거절 사유를 입력하세요", "");
    try {
      const response = await fetch(
        `${apiBase}/admin/portal/requests/${requestId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": portalPassword,
          },
          body: JSON.stringify({ memo: memo ?? undefined }),
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setActionMessage("거절 처리되었습니다.");
      await fetchRequests();
    } catch (error) {
      console.error("[admin-portal] 거절 실패", error);
      setActionMessage("거절 처리에 실패했습니다.");
    }
  };

  if (!authenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-slate-50">
        <section className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
          <h1 className="text-xl font-semibold text-center">관리자 포털</h1>
          <p className="text-sm text-slate-300 text-center">
            비밀번호를 입력하면 승인 대기 목록을 확인할 수 있습니다.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">접속 비밀번호</span>
              <input
                type="password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 p-2 text-slate-100 focus:border-sky-500 focus:outline-none"
                placeholder="Ckdgml9788@"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-sky-500 py-2 font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              접속하기
            </button>
            {loginError && (
              <p className="text-center text-xs text-rose-300">{loginError}</p>
            )}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">관리자 승인 대시보드</h1>
          <p className="text-sm text-slate-300">
            UID 승인 요청을 검토하고 승인/거절할 수 있습니다. 하단 버튼으로 목록을 새로고침하세요.
          </p>
        </header>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchRequests()}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            목록 새로고침
          </button>
          <span className="text-xs text-slate-400">
            총 {requests.length}건 • {loading ? "불러오는 중" : "갱신 완료"}
          </span>
          {actionMessage && (
            <span className="text-xs text-emerald-300">{actionMessage}</span>
          )}
        </div>
        <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">UID</th>
                <th className="px-4 py-3 text-left">거래소</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">요청 시각</th>
                <th className="px-4 py-3 text-left">메모</th>
                <th className="px-4 py-3 text-left">조치</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {requests.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-xs">{item.uid}</td>
                  <td className="px-4 py-3 uppercase">{item.exchange}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.status === 'PENDING'
                        ? '대기'
                        : item.status === 'APPROVED'
                        ? '승인'
                        : '거절'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {new Date(item.createdAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {item.memo ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => void approveRequest(item.id)}
                        className="rounded-md bg-emerald-500/80 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                        disabled={item.status !== 'PENDING'}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => void rejectRequest(item.id)}
                        className="rounded-md bg-rose-500/80 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-rose-400"
                        disabled={item.status !== 'PENDING'}
                      >
                        거절
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-sm text-slate-400"
                    colSpan={6}
                  >
                    대기 중인 요청이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
