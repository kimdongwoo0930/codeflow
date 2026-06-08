"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";

// ─── 타입 ────────────────────────────────────────────────────

type ProblemSummary = {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  description: string;
  status: "IN_PROGRESS" | "SOLVED" | null;
};

type Section = {
  topic: string;
  description: string;
  totalCount: number;
  solvedCount: number;
  problems: ProblemSummary[];
};

// ─── 유틸 ────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function StatusBadge({ status }: { status: ProblemSummary["status"] }) {
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

// ─── 메인 컴포넌트 ──────────────────────────────────────────

export function StageProblemList() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [openTopics, setOpenTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/stage-problems/sections", { headers: authHeaders() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setSections(res.data);
          setOpenTopics([res.data[0]?.topic]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleSection = (topic: string) => {
    setOpenTopics((current) =>
      current.includes(topic)
        ? current.filter((t) => t !== topic)
        : [...current, topic],
    );
  };

  const handleProblemClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      event.preventDefault();
      setPendingHref(href);
    }
  };

  if (loading) {
    return (
      <section className="px-5 pb-20 pt-28 sm:px-8 sm:pb-24 sm:pt-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue">
              {"// step problems"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">
              단계별 문제 풀기
            </h1>
          </div>
          <div className="flex items-center justify-center py-20">
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
      </section>
    );
  }

  return (
    <section className="px-5 pb-20 pt-28 sm:px-8 sm:pb-24 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue">
            {"// step problems"}
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-5xl">
            단계별 문제 풀기
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            파트를 열어서 문제를 고르고, 필요한 개념부터 차근차근 풀어보세요.
          </p>
        </div>

        <div className="space-y-3">
          {sections.map((section, index) => {
            const isOpen = openTopics.includes(section.topic);
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
                  onClick={() => toggleSection(section.topic)}
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
                          onClick={(event) =>
                            handleProblemClick(
                              event,
                              `/study?stageId=${problem.id}`,
                            )
                          }
                          className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue/40 hover:bg-white/[0.06]"
                        >
                          <span className="flex min-w-0 items-start justify-between gap-2">
                            <span className="block text-sm font-semibold text-slate-100 transition group-hover:text-white">
                              {problem.title}
                            </span>
                            <StatusBadge status={problem.status} />
                          </span>
                          <span className="block text-xs leading-5 text-slate-500 transition group-hover:text-slate-400">
                            {problem.description}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {pendingHref && (
        <AuthModal
          initialMode="login"
          onClose={() => setPendingHref(null)}
          onSuccess={() => {
            const href = pendingHref;
            setPendingHref(null);
            if (href) router.push(href);
          }}
        />
      )}
    </section>
  );
}
