"use client";

import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── 타입 ────────────────────────────────────────────────────

type ProblemStatus = "solved" | "inprogress" | "created";

interface MyProblem {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  status: ProblemStatus;
  date: string;
}

interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  profileImage: string | null;
}

// ─── 유틸 ────────────────────────────────────────────────────

function difficultyStyle(difficulty: string) {
  const d = difficulty;
  if (d === "쉬움" || d === "EASY")
    return "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20";
  if (d === "보통" || d === "MEDIUM")
    return "bg-amber-400/10 text-amber-400 border border-amber-400/20";
  if (d === "어려움" || d === "HARD")
    return "bg-rose-400/10 text-rose-400 border border-rose-400/20";
  return "bg-blue/10 text-blue border border-blue/20"; // 입문 등
}

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── 서브 컴포넌트 ──────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="panel-border rounded-2xl bg-bg2/70 p-5 text-center">
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function ProblemRow({ problem }: { problem: MyProblem }) {
  const actionLabel =
    problem.status === "solved"
      ? "다시 풀기"
      : problem.status === "inprogress"
        ? "이어 풀기"
        : "풀기";

  return (
    <div className="group panel-border flex flex-col gap-3 rounded-xl bg-bg2/50 p-4 transition hover:border-blue/30 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:gap-0">
      <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 font-medium text-slate-100 transition group-hover:text-white">
          {problem.title}
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-blue/20 bg-blue/10 px-2.5 py-0.5 text-xs font-medium text-blue">
            {problem.topic}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyStyle(problem.difficulty)}`}
          >
            {problem.difficulty}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:ml-4 sm:justify-end sm:gap-3">
        <span className="text-xs text-slate-500">{problem.date}</span>
        <a
          href={`/study?problemId=${problem.id}`}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue/40 hover:text-blue"
        >
          {actionLabel}
        </a>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────

type Tab = "solved" | "inprogress" | "created";

const TABS: { key: Tab; label: string }[] = [
  { key: "solved", label: "풀었던 문제" },
  { key: "inprogress", label: "풀던 문제" },
  { key: "created", label: "생성한 문제" },
];

export default function MyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("solved");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [problems, setProblems] = useState<MyProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = authHeaders() as Record<string, string>;
        const [userRes, problemsRes] = await Promise.all([
          fetch("/api/user/me", { headers }).then((r) => r.json()),
          fetch("/api/v1/problems/my", { headers }).then((r) => r.json()),
        ]);
        if (userRes.success) setUser(userRes.data);
        else setError(userRes.message ?? "사용자 정보를 불러올 수 없어요.");
        if (problemsRes.success) setProblems(problemsRes.data ?? []);
      } catch (e) {
        console.error("마이페이지 로드 실패:", e);
        setError("서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const filtered = problems.filter((p) => p.status === tab);
  const solvedCount = problems.filter((p) => p.status === "solved").length;
  const inProgressCount = problems.filter((p) => p.status === "inprogress").length;
  const createdCount = problems.filter((p) => p.status === "created").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-slate-50">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-2 w-2 animate-bounce rounded-full bg-blue"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg text-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 gap-4 text-slate-400">
          <p className="text-4xl">⚠️</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); }}
            className="mt-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:border-blue/40 hover:text-blue"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-slate-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-5 pb-24 pt-28 sm:px-8">
        {/* 프로필 헤더 */}
        <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue to-purple text-3xl font-bold text-white shadow-glow">
            {user?.nickname?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              {user?.nickname ?? "—"}
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">{user?.email ?? ""}</p>
          </div>
        </div>

        {/* 통계 */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          <StatCard label="풀었던 문제" value={solvedCount} sub="개" />
          <StatCard label="풀던 문제" value={inProgressCount} sub="개" />
          <StatCard label="생성한 문제" value={createdCount} sub="개" />
        </div>

        {/* 탭 */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                tab === key
                  ? "bg-gradient-to-r from-blue to-purple text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">
                ({problems.filter((p) => p.status === key).length})
              </span>
            </button>
          ))}
        </div>

        {/* 문제 목록 */}
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((problem) => (
              <ProblemRow key={problem.id} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <p className="mb-4 text-4xl">📭</p>
            <p className="text-sm">아직 문제가 없어요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
