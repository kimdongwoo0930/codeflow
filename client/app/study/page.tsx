"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TestLab } from "@/components/TestLab";
import { getStageProblem, type StageProblem as StageData } from "@/data/stageProblems";

type GeneratedProblem = {
  title: string;
  description: string;
  inputExample: string;
  outputExample: string;
  constraints: string[];
  hint?: string;
  startCode?: string;
  answerCode?: string;
  expectedOutput: string;
};

type Meta = {
  studyType: string;
  topic: string;
  difficulty: string;
  problemId?: number | null;
};

type ProblemDetail = {
  id: number;
  title: string;
  description: string;
  studyType: string;
  topic: string;
  difficulty: string;
  inputExample: string;
  outputExample: string;
  constraints: string[];
  hint?: string;
  startCode?: string;
  lastCode?: string;
};

type Problem = {
  title: string;
  difficulty: "입문" | "쉬움" | "보통" | "어려움";
  description: string;
  inputFormat: string;
  outputFormat: string;
  examples: { input: string; expected: string }[];
  constraints: string[];
  hint?: string;
  startCode?: string;
  lastCode?: string;
  expectedOutput?: string;
  answerCode?: string;
  problemId?: number | null;
};

function mapToProblem(data: GeneratedProblem, meta: Meta): Problem {
  return {
    title: data.title,
    difficulty: meta.difficulty as Problem["difficulty"],
    description: data.description,
    inputFormat: data.inputExample,
    outputFormat: data.outputExample,
    examples: [{ input: data.inputExample, expected: data.expectedOutput }],
    constraints: data.constraints ?? [],
    hint: data.hint,
    startCode: data.startCode,
    expectedOutput: data.expectedOutput,
    answerCode: data.answerCode,
    problemId: meta.problemId ?? null,
  };
}

function mapStageToProblem(data: StageData): Problem {
  return {
    title: data.title,
    difficulty: data.difficulty,
    description: data.description,
    inputFormat: data.inputExample,
    outputFormat: data.outputExample,
    examples: [{ input: data.inputExample, expected: data.outputExample }],
    constraints: data.constraints ? [data.constraints] : [],
    startCode: data.starterCode,
    problemId: null,
  };
}

function mapDetailToProblem(data: ProblemDetail): Problem {
  return {
    title: data.title,
    difficulty: data.difficulty as Problem["difficulty"],
    description: data.description,
    inputFormat: data.inputExample,
    outputFormat: data.outputExample,
    examples: [{ input: data.inputExample, expected: data.outputExample }],
    constraints: data.constraints ?? [],
    hint: data.hint,
    startCode: data.startCode,
    lastCode: data.lastCode,
    expectedOutput: undefined,
    answerCode: undefined,
    problemId: data.id,
  };
}

function StudyPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemIdParam = searchParams.get("problemId");
  const conceptParam = searchParams.get("concept");
  const stageIdParam = searchParams.get("stageId");

  const [problem, setProblem] = useState<Problem | undefined>(undefined);
  const [isAlgorithm, setIsAlgorithm] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
    // 단계별 문제(JSON 더미데이터)는 stageId로 로컬에서 직접 로드
    if (stageIdParam) {
      const stage = getStageProblem(Number(stageIdParam));
      if (stage) {
        setProblem(mapStageToProblem(stage));
        setIsAlgorithm(false);
      }
      setFetchDone(true);
      return;
    }

    // URL에 problemId가 있으면 API에서 직접 fetch
    if (problemIdParam) {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      fetch(`/api/v1/problems/${problemIdParam}`, { headers })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            const data: ProblemDetail = res.data;
            setProblem(mapDetailToProblem(data));
            setIsAlgorithm(data.studyType === "알고리즘");
          }
        })
        .catch(() => {})
        .finally(() => setFetchDone(true));
      return;
    }

    // 기존: sessionStorage에서 읽기
    const raw = sessionStorage.getItem("generatedProblem");
    const rawMeta = sessionStorage.getItem("generatedProblemMeta");
    if (raw && rawMeta) {
      try {
        const data: GeneratedProblem = JSON.parse(raw);
        const meta: Meta = JSON.parse(rawMeta);
        // problemId가 있으면 URL에 반영 → 재마운트 시 API fetch로 lastCode 복원
        if (meta.problemId) {
          router.replace(`/study?problemId=${meta.problemId}`);
          return;
        }
        setProblem(mapToProblem(data, meta));
        setIsAlgorithm(meta.studyType === "알고리즘");
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }
    setFetchDone(true);
  }, [problemIdParam, stageIdParam, router]);

  // problem이 확정되기 전에 TestLab이 마운트되면 editorCode 초기화가 틀림 — 항상 대기
  if (!fetchDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f1a]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 animate-bounce rounded-full bg-blue-500"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <TestLab
      problem={problem}
      isAlgorithm={isAlgorithm}
      conceptTopic={conceptParam ?? undefined}
    />
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={null}>
      <StudyPageInner />
    </Suspense>
  );
}
