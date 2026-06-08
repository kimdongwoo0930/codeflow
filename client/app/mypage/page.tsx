"use client";

import { Navbar } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── 타입 ────────────────────────────────────────────────────

type ProblemStatus = "solved" | "inprogress" | "created";
type ProblemType = "ai" | "stage";

interface MyProblem {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  status: ProblemStatus;
  date: string;
  type: ProblemType;
}

interface StageProblemSummary {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  status: "IN_PROGRESS" | "SOLVED" | null;
}

interface StageSection {
  topic: string;
  description: string;
  totalCount: number;
  solvedCount: number;
  problems: StageProblemSummary[];
}

interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  profileImage: string | null;
}

// ─── 유틸 ────────────────────────────────────────────────────

function difficultyStyle(difficulty: string) {
  if (difficulty === "쉬움" || difficulty === "EASY")
    return "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20";
  if (difficulty === "보통" || difficulty === "MEDIUM")
    return "bg-amber-400/10 text-amber-400 border border-amber-400/20";
  if (difficulty === "어려움" || difficulty === "HARD")
    return "bg-rose-400/10 text-rose-400 border border-rose-400/20";
  return "bg-blue/10 text-blue border border-blue/20";
}

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeAiStatus(status: string): ProblemStatus {
  if (status === "solved") return "solved";
  if (status === "inprogress") return "inprogress";
  return "created";
}

function StatusBadge({ status }: { status: StageProblemSummary["status"] }) {
  if (status === "SOLVED")
    return (
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
        완료
      </span>
    );
  if (status === "IN_PROGRESS")
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        진행중
      </span>
    );
  return null;
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

  const href =
    problem.type === "stage"
      ? `/study?stageId=${problem.id}`
      : `/study?problemId=${problem.id}`;

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
          href={href}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue/40 hover:text-blue"
        >
          {actionLabel}
        </a>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────

type MainTab = "stage" | "generated";
type SubTab = "solved" | "inprogress" | "created";

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: "stage", label: "단계별 학습" },
  { key: "generated", label: "생성된 문제" },
];

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "solved", label: "풀었던 문제" },
  { key: "inprogress", label: "풀던 문제" },
  { key: "created", label: "생성한 문제" },
];

export default function MyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<MainTab>("stage");
  const [subTab, setSubTab] = useState<SubTab>("solved");
  const [openStageTopics, setOpenStageTopics] = useState<string[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [aiProblems, setAiProblems] = useState<MyProblem[]>([]);
  const [stageSections, setStageSections] = useState<StageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleStageTopic = (topic: string) => {
    setOpenStageTopics((current) =>
      current.includes(topic)
        ? current.filter((t) => t !== topic)
        : [...current, topic],
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = authHeaders() as Record<string, string>;
        const [userRes, aiProblemsRes, stageSectionsRes] = await Promise.all([
          fetch("/api/user/me", { headers }).then((r) => r.json()),
          fetch("/api/v1/problems/my", { headers }).then((r) => r.json()),
          fetch("/api/v1/stage-problems/sections", { headers }).then((r) => r.json()),
        ]);

        if (userRes.success) setUser(userRes.data);
        else setError(userRes.message ?? "사용자 정보를 불러올 수 없어요.");

        const aiList: MyProblem[] = (aiProblemsRes.success ? aiProblemsRes.data ?? [] : []).map(
          (p: { id: number; title: string; topic: string; difficulty: string; status: string; date: string }) => ({
            ...p,
            status: normalizeAiStatus(p.status),
            type: "ai" as ProblemType,
          }),
        );
        setAiProblems(aiList);

        if (stageSectionsRes.success && stageSectionsRes.data) {
          setStageSections(stageSectionsRes.data);
          // 첫 섹션 기본 열기
          setOpenStageTopics([stageSectionsRes.data[0]?.topic]);
        }
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

  const filtered = aiProblems.filter((p) =>
    subTab === "created" ? p.status === "created" : p.status === subTab,
  );
  const solvedCount = aiProblems.filter((p) => p.status === "solved").length;
  const inProgressCount = aiProblems.filter((p) => p.status === "inprogress").length;
  const createdCount = aiProblems.filter((p) => p.status === "created").length;

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

        {/* 메인 탭 */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
          {MAIN_TABS.map(({ key, label }) => (
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
            </button>
          ))}
        </div>

        {tab === "stage" ? (
          /* ── 단계별 학습 탭 ── */
          <div className="space-y-3">
            {stageSections.map((section, index) => {
              const isOpen = openStageTopics.includes(section.topic);
              const progressPct =
                section.totalCount > 0
                  ? Math.round((section.solvedCount / section.totalCount) * 100)
                  : 0;

              return (
                <div
                  key={section.topic}
                  className="overflow-hidden rounded-xl border border-white/10 bg-bg2/70"
                >
                  <button
                    type="button"
                    onClick={() => toggleStageTopic(section.topic)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.04]"
                    aria-expanded={isOpen}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue/25 bg-blue/10 text-sm font-semibold text-blue">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-100">
                        {section.topic}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-slate-400">
                        {section.description}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-slate-400">
                        {section.solvedCount}/{section.totalCount} · {isOpen ? "-" : "+"}
                      </span>
                      {section.solvedCount > 0 && (
                        <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                          <span
                            className="block h-full rounded-full bg-emerald-400"
                            style={{ width: `${progressPct}%` }}
                          />
                        </span>
                      )}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 px-5 py-4">
                      <div className="space-y-2">
                        {section.problems.map((problem) => (
                          <Link
                            key={problem.id}
                            href={`/study?stageId=${problem.id}`}
                            className="group flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue/40 hover:bg-white/[0.06]"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-slate-100 transition group-hover:text-white">
                                {problem.title}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-slate-500 transition group-hover:text-slate-400">
                                {problem.description}
                              </span>
                            </span>
                            <StatusBadge status={problem.status} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ── 생성된 문제 탭 ── */
          <>
            <div className="mb-6 grid grid-cols-3 gap-4">
              <StatCard label="풀었던 문제" value={solvedCount} sub="개" />
              <StatCard label="풀던 문제" value={inProgressCount} sub="개" />
              <StatCard label="생성한 문제" value={createdCount} sub="개" />
            </div>

            <div className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1">
              {SUB_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSubTab(key)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                    subTab === key
                      ? "bg-gradient-to-r from-blue to-purple text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                  <span className="ml-1.5 text-xs opacity-70">
                    ({aiProblems.filter((p) => p.status === key).length})
                  </span>
                </button>
              ))}
            </div>

            {filtered.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filtered.map((problem) => (
                  <ProblemRow key={`ai-${problem.id}`} problem={problem} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <p className="mb-4 text-4xl">📭</p>
                <p className="text-sm">아직 문제가 없어요.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
