"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
import { STAGE_SECTIONS, type StageDifficulty } from "@/data/stageProblems";

// ─── 데이터 ──────────────────────────────────────────────────

interface Problem {
  id: number;
  title: string;
  category: string;
  difficulty: StageDifficulty;
  description: string;
}

// 단계별 문제 전체를 평탄화해 카드용 데이터로 변환
const ALL_STAGE_PROBLEMS: Problem[] = STAGE_SECTIONS.flatMap((section) =>
  section.problems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    category: section.topic,
    difficulty: problem.difficulty,
    description: problem.description,
  })),
);

function pickRandomProblems(count: number): Problem[] {
  const shuffled = [...ALL_STAGE_PROBLEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── 서브 컴포넌트 ──────────────────────────────────────────

const DIFFICULTY_STYLE: Record<StageDifficulty, string> = {
  입문: "bg-blue/10 text-blue border border-blue/20",
  쉬움: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20",
  보통: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  어려움: "bg-rose-400/10 text-rose-400 border border-rose-400/20",
};

function ProblemCard({
  problem,
  onProtectedClick,
}: {
  problem: Problem;
  onProtectedClick: (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => void;
}) {
  const href = `/study?stageId=${problem.id}`;
  return (
    <Link
      href={href}
      onClick={(event) => onProtectedClick(event, href)}
      className="group panel-border flex flex-col rounded-2xl bg-bg2/70 p-5 transition duration-300 hover:-translate-y-1 hover:border-blue/35 hover:bg-white/[0.05] hover:shadow-[0_12px_36px_rgba(15,23,42,0.5)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-xs font-medium text-blue border border-blue/20">
          {problem.category}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_STYLE[problem.difficulty]}`}
        >
          {problem.difficulty}
        </span>
      </div>
      <h3 className="mb-2 text-base font-semibold text-slate-100 transition group-hover:text-white">
        {problem.title}
      </h3>
      <p className="flex-1 text-sm leading-6 text-slate-400 transition group-hover:text-slate-300">
        {problem.description}
      </p>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500"></div>
    </Link>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────

export function ProblemList() {
  const router = useRouter();
  // 로그인 안 된 상태에서 누른 문제의 이동 경로 (로그인 성공 시 이동)
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  // 단계별 문제 중 무작위 6개 (서버/클라이언트 첫 렌더 불일치 방지를 위해 마운트 후 선정)
  const [curatedProblems, setCuratedProblems] = useState<Problem[]>(() =>
    ALL_STAGE_PROBLEMS.slice(0, 6),
  );

  useEffect(() => {
    setCuratedProblems(pickRandomProblems(6));
  }, []);

  const handleProtectedClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      event.preventDefault();
      setPendingHref(href);
    }
  };

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        {/* 헤더 */}
        <div className="reveal-up flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue">
              {"// problems"}
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
              지금 바로 풀어보세요
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              엄선된 문제로 빠르게 시작하거나, 단계별 커리큘럼으로 이동해 보세요.
            </p>
          </div>

          <Link
            href="/stages"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-medium text-slate-300 transition hover:border-blue/40 hover:text-blue"
          >
            단계별 풀기
          </Link>
        </div>

        {/* 콘텐츠 */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {curatedProblems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              onProtectedClick={handleProtectedClick}
            />
          ))}
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
