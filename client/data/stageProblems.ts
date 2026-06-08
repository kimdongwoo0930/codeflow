import rawProblems from "./problems.json";

export type StageDifficulty = "입문" | "쉬움" | "보통" | "어려움";

type RawProblem = {
  topic: string;
  title: string;
  description: string;
  constraints: string;
  input_example: string;
  output_example: string;
  starter_code: string;
};

export type StageProblem = {
  id: number;
  topic: string;
  title: string;
  difficulty: StageDifficulty;
  description: string;
  constraints: string;
  inputExample: string;
  outputExample: string;
  starterCode: string;
};

export type StageSection = {
  topic: string;
  description: string;
  problems: StageProblem[];
};

// topic별 난이도 — JSON에는 난이도 정보가 없어 개념 순서를 기준으로 부여한다.
const TOPIC_DIFFICULTY: Record<string, StageDifficulty> = {
  출력문: "입문",
  연산: "입문",
  반복문: "쉬움",
  조건문: "쉬움",
  문자열: "보통",
  리스트: "보통",
  "2차원 리스트": "보통",
};

const TOPIC_DESCRIPTION: Record<string, string> = {
  출력문: "System.out.println으로 원하는 결과를 정확히 출력합니다.",
  연산: "산술 연산자와 나머지 연산으로 값을 계산합니다.",
  반복문: "for와 while로 같은 작업을 여러 번 처리합니다.",
  조건문: "if / else if / else로 상황에 따라 다른 코드를 실행합니다.",
  문자열: "String 메서드로 텍스트의 길이와 형태를 다룹니다.",
  리스트: "여러 값을 순서대로 저장하고 인덱스로 접근합니다.",
  "2차원 리스트": "행과 열로 구성된 값을 순회하며 처리합니다.",
};

// JSON starter_code는 들여쓰기가 없어 중괄호 기준으로 2칸씩 다시 정렬한다.
function indentJavaCode(code: string): string {
  const INDENT = "  ";
  let depth = 0;

  return code
    .split("\n")
    .map((rawLine) => {
      const line = rawLine.trim();
      if (line === "") return "";

      // 줄 맨 앞의 닫는 중괄호 수만큼만 이 줄의 표시 깊이를 낮춘다.
      const leadingCloses = (line.match(/^}+/)?.[0] ?? "").length;
      const displayDepth = Math.max(0, depth - leadingCloses);
      const indented = INDENT.repeat(displayDepth) + line;

      // 줄 전체의 중괄호 균형으로 다음 줄 깊이를 갱신한다.
      const opens = (line.match(/{/g) ?? []).length;
      const closes = (line.match(/}/g) ?? []).length;
      depth = Math.max(0, depth + opens - closes);

      return indented;
    })
    .join("\n");
}

// JSON 문제는 DB id가 없으므로 배열 인덱스를 안정적인 id로 사용한다.
export const STAGE_PROBLEMS: StageProblem[] = (rawProblems as RawProblem[]).map(
  (problem, index) => ({
    id: index,
    topic: problem.topic,
    title: problem.title,
    difficulty: TOPIC_DIFFICULTY[problem.topic] ?? "보통",
    description: problem.description,
    constraints: problem.constraints,
    inputExample: problem.input_example,
    outputExample: problem.output_example,
    starterCode: indentJavaCode(problem.starter_code),
  }),
);

// topic 등장 순서를 보존하며 섹션으로 묶는다.
export const STAGE_SECTIONS: StageSection[] = (() => {
  const sectionByTopic = new Map<string, StageSection>();

  for (const problem of STAGE_PROBLEMS) {
    let section = sectionByTopic.get(problem.topic);
    if (!section) {
      section = {
        topic: problem.topic,
        description: TOPIC_DESCRIPTION[problem.topic] ?? "",
        problems: [],
      };
      sectionByTopic.set(problem.topic, section);
    }
    section.problems.push(problem);
  }

  return [...sectionByTopic.values()];
})();

export function getStageProblem(id: number): StageProblem | undefined {
  return STAGE_PROBLEMS[id];
}
