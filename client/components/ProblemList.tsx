"use client";

import Link from "next/link";

// ─── 더미 데이터 ────────────────────────────────────────────

type Difficulty = "쉬움" | "보통" | "어려움";

interface Problem {
  id: number;
  title: string;
  category: string;
  difficulty: Difficulty;
  description: string;
}

const CURATED_PROBLEMS: Problem[] = [
  {
    id: 1,
    title: "투 포인터 입문",
    category: "배열",
    difficulty: "쉬움",
    description:
      "정렬된 배열에서 두 포인터를 이용해 합이 목표값인 쌍을 찾습니다.",
  },
  {
    id: 2,
    title: "스택으로 괄호 검사",
    category: "스택",
    difficulty: "쉬움",
    description: "스택 자료구조를 활용해 올바른 괄호 문자열인지 판별합니다.",
  },
  {
    id: 3,
    title: "BFS로 최단 경로 찾기",
    category: "그래프",
    difficulty: "보통",
    description:
      "너비 우선 탐색으로 미로에서 출발지부터 목적지까지 최단 거리를 구합니다.",
  },
  {
    id: 4,
    title: "DP 첫걸음 — 계단 오르기",
    category: "동적 프로그래밍",
    difficulty: "보통",
    description:
      "n번째 계단에 오르는 방법의 수를 메모이제이션으로 효율적으로 계산합니다.",
  },
  {
    id: 5,
    title: "재귀로 구현하는 팩토리얼",
    category: "재귀",
    difficulty: "쉬움",
    description:
      "재귀 함수의 기본 원리를 팩토리얼 계산으로 이해하고 Call Stack 흐름을 시각화합니다.",
  },
  {
    id: 6,
    title: "다익스트라 기초",
    category: "그래프",
    difficulty: "어려움",
    description:
      "우선순위 큐를 활용한 다익스트라 알고리즘으로 가중치 그래프의 최단 경로를 구합니다.",
  },
];

// ─── 서브 컴포넌트 ──────────────────────────────────────────

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  쉬움: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20",
  보통: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  어려움: "bg-rose-400/10 text-rose-400 border border-rose-400/20",
};

function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Link
      href={`/study?id=${problem.id}`}
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
          {CURATED_PROBLEMS.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      </div>
    </section>
  );
}
