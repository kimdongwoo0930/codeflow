"use client";

import Link from "next/link";
import { useState } from "react";

// ─── 더미 데이터 ────────────────────────────────────────────

type Difficulty = "쉬움" | "보통" | "어려움";

interface Problem {
  id: number;
  title: string;
  category: string;
  difficulty: Difficulty;
  description: string;
}

interface Stage {
  step: number;
  title: string;
  description: string;
  problemCount: number;
  topics: string[];
  color: string;
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

const STAGES: Stage[] = [
  {
    step: 1,
    title: "프로그래밍 기초",
    description: "변수, 조건문, 반복문의 실행 흐름을 시각화로 익힙니다.",
    problemCount: 8,
    topics: ["변수", "조건문", "반복문", "함수"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    step: 2,
    title: "자료구조 입문",
    description:
      "스택, 큐, 연결 리스트가 메모리에서 어떻게 동작하는지 배웁니다.",
    problemCount: 10,
    topics: ["스택", "큐", "연결 리스트", "해시맵"],
    color: "from-blue to-cyan",
  },
  {
    step: 3,
    title: "탐색과 정렬",
    description:
      "이진 탐색, 버블·퀵 정렬의 단계별 동작 원리를 눈으로 확인합니다.",
    problemCount: 12,
    topics: ["이진 탐색", "버블 정렬", "퀵 정렬", "병합 정렬"],
    color: "from-purple to-indigo-500",
  },
  {
    step: 4,
    title: "그래프와 트리",
    description: "BFS, DFS, 그리고 트리 순회를 시각화로 완전히 이해합니다.",
    problemCount: 14,
    topics: ["BFS", "DFS", "트리 순회", "최단 경로"],
    color: "from-orange-500 to-rose-500",
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

function StageCard({ stage }: { stage: Stage }) {
  return (
    <Link
      href={`/study?stage=${stage.step}`}
      className="group panel-border relative overflow-hidden rounded-2xl bg-bg2/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue/35 hover:bg-white/[0.05] hover:shadow-[0_12px_36px_rgba(15,23,42,0.5)]"
    >
      {/* 배경 그라데이션 */}
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${stage.color} opacity-10 blur-2xl transition duration-500 group-hover:opacity-20`}
      />

      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stage.color} text-sm font-bold text-white shadow-lg`}
        >
          {stage.step}
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 transition group-hover:text-white">
            {stage.title}
          </h3>
          <p className="text-xs text-slate-500">{stage.problemCount}개 문제</p>
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-slate-400 transition group-hover:text-slate-300">
        {stage.description}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {stage.topics.map((topic) => (
          <span
            key={topic}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400"
          >
            {topic}
          </span>
        ))}
      </div>
    </Link>
  );
}

// ─── 메인 컴포넌트 ──────────────────────────────────────────

type Tab = "curated" | "stages";

export function ProblemList() {
  const [tab, setTab] = useState<Tab>("curated");

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
              엄선된 문제로 빠르게 시작하거나, 단계별 커리큘럼을 따라가 보세요.
            </p>
          </div>

          {/* 탭 */}
          <div className="flex shrink-0 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setTab("curated")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === "curated"
                  ? "bg-gradient-to-r from-blue to-purple text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              큐레이션 문제
            </button>
            <button
              onClick={() => setTab("stages")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                tab === "stages"
                  ? "bg-gradient-to-r from-blue to-purple text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              단계별 풀기
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="mt-10">
          {tab === "curated" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {CURATED_PROBLEMS.map((problem) => (
                <ProblemCard key={problem.id} problem={problem} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {STAGES.map((stage) => (
                <StageCard key={stage.step} stage={stage} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
