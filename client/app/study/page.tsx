"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TestLab } from "@/components/TestLab";

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
    expectedOutput: undefined,
    answerCode: undefined,
    problemId: data.id,
  };
}

function StudyPageInner() {
  const searchParams = useSearchParams();
  const problemIdParam = searchParams.get("problemId");

  const [problem, setProblem] = useState<Problem | undefined>(undefined);
  const [isAlgorithm, setIsAlgorithm] = useState(false);
  const [fetchDone, setFetchDone] = useState(false);

  useEffect(() => {
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
        setProblem(mapToProblem(data, meta));
        setIsAlgorithm(meta.studyType === "알고리즘");
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }
    setFetchDone(true);
  }, [problemIdParam]);

  // problemId 로딩 중엔 TestLab 마운트를 막아서 editorCode 초기화 문제 방지
  if (problemIdParam && !fetchDone) {
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

  return <TestLab problem={problem} isAlgorithm={isAlgorithm} />;
}

export default function StudyPage() {
  return (
    <Suspense fallback={null}>
      <StudyPageInner />
    </Suspense>
  );
}
