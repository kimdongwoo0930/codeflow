"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  lastCode?: string;
};

type StageProblemDetail = {
  id: number;
  topic: string;
  title: string;
  difficulty: string;
  description: string;
  constraints: string[];
  inputExample: string;
  outputExample: string;
  starterCode: string;
  lastCode?: string;
  status?: string;
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
  stageProblemId?: number | null;
};

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

function mapStageApiToProblem(data: StageProblemDetail): Problem {
  return {
    title: data.title,
    difficulty: data.difficulty as Problem["difficulty"],
    description: data.description,
    inputFormat: data.inputExample,
    outputFormat: data.outputExample,
    examples: [{ input: data.inputExample, expected: data.outputExample }],
    constraints: data.constraints ?? [],
    startCode: data.starterCode,
    lastCode: data.lastCode ?? undefined,
    stageProblemId: data.id,
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
    // 단계별 문제: API에서 가져오기 (lastCode 포함)
    if (stageIdParam) {
      fetch(`/api/v1/stage-problems/${stageIdParam}`, {
        headers: authHeaders(),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && res.data) {
            const data = res.data as StageProblemDetail;
            setProblem(mapStageApiToProblem(data));

            // 처음 진입 시 진행 중으로 등록 (이미 기록 있으면 서버에서 무시)
            const token = localStorage.getItem("accessToken");
            if (token && !data.status) {
              fetch(`/api/v1/stage-problems/${stageIdParam}/progress`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  code: data.lastCode ?? data.starterCode ?? "",
                  solved: false,
                }),
              }).catch(() => {});
            }
          }
        })
        .catch(() => {})
        .finally(() => setFetchDone(true));
      return;
    }

    // URL에 problemId가 있으면 API에서 직접 fetch
    if (problemIdParam) {
      fetch(`/api/v1/problems/${problemIdParam}`, { headers: authHeaders() })
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
