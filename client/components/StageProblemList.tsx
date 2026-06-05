"use client";

import Link from "next/link";
import { useState } from "react";
import { STAGE_SECTIONS } from "@/data/stageProblems";

export function StageProblemList() {
  const [openTopics, setOpenTopics] = useState<string[]>([
    STAGE_SECTIONS[0]?.topic,
  ]);

  const toggleSection = (topic: string) => {
    setOpenTopics((current) =>
      current.includes(topic)
        ? current.filter((openTopic) => openTopic !== topic)
        : [...current, topic],
    );
  };

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
          {STAGE_SECTIONS.map((section, index) => {
            const isOpen = openTopics.includes(section.topic);

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
                  <span className="shrink-0 text-sm font-semibold text-slate-400">
                    {section.problems.length}문제 · {isOpen ? "-" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-5 py-4">
                    <div className="space-y-2">
                      {section.problems.map((problem) => (
                        <Link
                          key={problem.id}
                          href={`/study?stageId=${problem.id}`}
                          className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue/40 hover:bg-white/[0.06]"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-100 transition group-hover:text-white">
                              {problem.title}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500 transition group-hover:text-slate-400">
                              {problem.description}
                            </span>
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
    </section>
  );
}
