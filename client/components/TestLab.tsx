"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type * as Monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type StackVar = { name: string; type: string; value: string };
type HeapItem = { addr: string; type: string; value: string };
type Snapshot = {
  line: number;
  stack: StackVar[];
  heap: HeapItem[];
  output: string;
  note: string;
};
type Language = "java";
type Trace = {
  title: string;
  code: string;
  snapshots: Snapshot[];
  language: Language;
};
type TestCase = { input: string; expected: string };
type TestResult = {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
};
type ChatMessage = { role: "ai" | "user"; content: string };
type SubmissionReview = {
  passed: boolean;
  title: string;
  feedback: string;
  nextHint: string;
};
type Problem = {
  title: string;
  difficulty: "입문" | "쉬움" | "보통" | "어려움";
  description: string;
  inputFormat: string;
  outputFormat: string;
  examples: TestCase[];
  constraints: string[];
  hint?: string;
  startCode?: string;
  expectedOutput?: string;
  answerCode?: string;
  problemId?: number | null;
};

const JAVA_DEFAULT_CODE = `public class Main {
  public static void main(String[] args) {
    // 여기에 코드를 작성하세요
  }
}`;

const SUPPORTED_SYNTAX_BY_LANGUAGE: Record<Language, string[]> = {
  java: [
    "int, String (기본 자료형)",
    "int[] (배열)",
    "for / while 루프",
    "if / else 분기",
    "재귀 함수 (콜스택)",
    "swap (tmp 변수)",
    "System.out.println",
  ],
};

// ─────────────────────────────────────────────
// Dummy problem & test results
// ─────────────────────────────────────────────
const DUMMY_PROBLEM_ALGORITHM: Problem = {
  title: "배열의 최댓값",
  difficulty: "쉬움",
  description:
    "N개의 정수로 이루어진 배열이 주어진다. 배열에서 가장 큰 수를 찾아 출력하시오.",
  inputFormat:
    "첫째 줄에 배열의 크기 N이 주어진다.\n둘째 줄에 N개의 정수가 공백으로 구분되어 주어진다.",
  outputFormat: "배열에서 가장 큰 수를 출력한다.",
  examples: [
    { input: "4\n3 9 1 7", expected: "9" },
    { input: "5\n-1 -5 -3 -2 -4", expected: "-1" },
    { input: "3\n42 42 42", expected: "42" },
  ],
  constraints: ["1 ≤ N ≤ 100", "−1,000 ≤ 배열 원소 ≤ 1,000"],
};

const CONCEPT_PROBLEMS: Record<string, Problem> = {
  출력: {
    title: "Hello, Java!",
    difficulty: "입문",
    description: "화면에 Hello, Java!를 출력하는 프로그램을 작성하시오.",
    inputFormat: "없음",
    outputFormat: "Hello, Java!",
    examples: [{ input: "", expected: "Hello, Java!" }],
    constraints: [],
  },
  "변수·자료형": {
    title: "나이와 이름 출력",
    difficulty: "입문",
    description:
      'int형 변수 age에 20을, String형 변수 name에 "Java"를 저장하고 "이름: Java, 나이: 20" 형식으로 출력하시오.',
    inputFormat: "없음",
    outputFormat: "이름: Java, 나이: 20",
    examples: [{ input: "", expected: "이름: Java, 나이: 20" }],
    constraints: [],
  },
  "산술·연산자": {
    title: "사칙연산 결과 출력",
    difficulty: "입문",
    description:
      "두 정수 a=17, b=5를 선언하고 a+b, a-b, a*b, a/b, a%b를 각각 한 줄씩 출력하시오.",
    inputFormat: "없음",
    outputFormat: "22\n12\n85\n3\n2",
    examples: [{ input: "", expected: "22\n12\n85\n3\n2" }],
    constraints: [],
  },
  입력: {
    title: "정수 입력 후 출력",
    difficulty: "쉬움",
    description: "정수 하나를 입력받아 그대로 출력하시오.",
    inputFormat: "정수 N",
    outputFormat: "입력받은 정수 N",
    examples: [
      { input: "42", expected: "42" },
      { input: "0", expected: "0" },
    ],
    constraints: ["−1,000,000 ≤ N ≤ 1,000,000"],
  },
  조건문: {
    title: "양수·음수·영 판별",
    difficulty: "쉬움",
    description:
      "정수 하나를 입력받아 양수면 positive, 음수면 negative, 0이면 zero를 출력하시오.",
    inputFormat: "정수 N",
    outputFormat: "positive / negative / zero 중 하나",
    examples: [
      { input: "5", expected: "positive" },
      { input: "-3", expected: "negative" },
      { input: "0", expected: "zero" },
    ],
    constraints: ["−1,000 ≤ N ≤ 1,000"],
  },
  반복문: {
    title: "1부터 N까지 합",
    difficulty: "쉬움",
    description: "정수 N을 입력받아 1부터 N까지의 합을 출력하시오.",
    inputFormat: "정수 N",
    outputFormat: "1부터 N까지의 합",
    examples: [
      { input: "10", expected: "55" },
      { input: "1", expected: "1" },
    ],
    constraints: ["1 ≤ N ≤ 1,000"],
  },
  배열: {
    title: "배열 역순 출력",
    difficulty: "보통",
    description: "N개의 정수를 입력받아 역순으로 공백으로 구분하여 출력하시오.",
    inputFormat: "첫째 줄에 N, 둘째 줄에 N개의 정수",
    outputFormat: "역순으로 정렬된 정수들",
    examples: [
      { input: "5\n1 2 3 4 5", expected: "5 4 3 2 1" },
      { input: "3\n10 20 30", expected: "30 20 10" },
    ],
    constraints: ["1 ≤ N ≤ 100"],
  },
  함수: {
    title: "두 수 중 최댓값",
    difficulty: "보통",
    description:
      "두 정수를 입력받아 더 큰 수를 반환하는 메서드 max(int a, int b)를 작성하고 결과를 출력하시오.",
    inputFormat: "공백으로 구분된 두 정수 a, b",
    outputFormat: "두 수 중 더 큰 값",
    examples: [
      { input: "3 7", expected: "7" },
      { input: "10 10", expected: "10" },
    ],
    constraints: ["−1,000 ≤ a, b ≤ 1,000"],
  },
  문자열: {
    title: "문자열 정보 출력",
    difficulty: "보통",
    description:
      "문자열을 입력받아 첫 줄에 길이, 둘째 줄에 대문자로 변환한 결과를 출력하시오.",
    inputFormat: "문자열 s (공백 없음)",
    outputFormat: "길이\n대문자 변환 결과",
    examples: [
      { input: "hello", expected: "5\nHELLO" },
      { input: "java", expected: "4\nJAVA" },
    ],
    constraints: ["1 ≤ s의 길이 ≤ 100"],
  },
  재귀: {
    title: "팩토리얼",
    difficulty: "어려움",
    description: "재귀 함수를 이용해 N 팩토리얼(N!)을 구하여 출력하시오.",
    inputFormat: "정수 N",
    outputFormat: "N!",
    examples: [
      { input: "5", expected: "120" },
      { input: "0", expected: "1" },
    ],
    constraints: ["0 ≤ N ≤ 12"],
  },
  "컬렉션 기초": {
    title: "ArrayList 합계",
    difficulty: "어려움",
    description:
      "N개의 정수를 ArrayList에 저장하고 모든 원소의 합을 출력하시오.",
    inputFormat: "첫째 줄에 N, 둘째 줄에 N개의 정수",
    outputFormat: "합계",
    examples: [
      { input: "4\n1 2 3 4", expected: "10" },
      { input: "3\n-1 0 1", expected: "0" },
    ],
    constraints: ["1 ≤ N ≤ 100"],
  },
};

const LEFT_PANEL_MIN_WIDTH = 280;
const RIGHT_PANEL_MIN_WIDTH = 300;
const EDITOR_PANEL_MIN_WIDTH = 520;
const RESIZER_WIDTH = 10;
const OUTPUT_PANEL_MIN_HEIGHT = 96;
const OUTPUT_PANEL_MAX_HEIGHT = 360;

const QUICK_PROMPTS = ["어떻게 시작해요?"] as const;

function createInitialChatMessages(): ChatMessage[] {
  return [
    {
      role: "ai",
      content:
        '안녕하세요! AI 튜터예요. 문제를 풀다가 막히면 언제든 질문하세요.\n\n💡 이런 것들을 물어볼 수 있어요.\n- "어떻게 시작해요?" — 접근 방향\n- "for문 어떻게 써요?" — 문법 질문\n- "내 코드 어디가 틀렸어요?" — 코드 리뷰\n- "정답 알려줘" — 전체 코드 공개\n\n정답은 요청할 때만 드리고, 평소엔 다음 한 줄을 스스로 완성할 수 있도록 힌트로 도와드릴게요.',
    },
  ];
}

const DIFFICULTY_COLOR: Record<Problem["difficulty"], string> = {
  입문: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  쉬움: "border-blue/40 bg-blue/10 text-blue",
  보통: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  어려움: "border-red-500/40 bg-red-500/10 text-red-400",
};

// ─────────────────────────────────────────────
// Trace generators
// ─────────────────────────────────────────────
function lineOf(lines: string[], pattern: RegExp): number {
  const idx = lines.findIndex((l) => pattern.test(l));
  return idx === -1 ? 1 : idx + 1;
}

function generateTrace(code: string, language: Language): Trace {
  const lines = code.split("\n");
  if (language === "java") {
    if (
      /int\[\] arr = \{4, 2, 7, 1, 9\}/.test(code) &&
      /int target = 7/.test(code)
    )
      return makeLinearSearchTrace(lines, language);
    if (
      /int\[\] arr = \{5, 3, 1, 4\}/.test(code) &&
      /int tmp = arr\[j\]/.test(code)
    )
      return makeBubbleSortTrace(lines, language);
    if (/static int factorial/.test(code) && /factorial\(5\)/.test(code))
      return makeFactorialTrace(lines, language);
    if (/int a = 10/.test(code) && /int b = 20/.test(code))
      return makeSumTrace(lines, language);
    if (/int\[\] arr = \{3, 9, 1, 7\}/.test(code))
      return makeArrayMaxTrace(lines, language);
    if (/int left = 0/.test(code) && /int target/.test(code))
      return makeTwoPointerTrace(lines, code, language);
    if (/int n = 7/.test(code) && /a = 0, b = 1/.test(code))
      return makeFibTrace(lines, language);
    return makeFallbackTrace(lines, language);
  }

  if (/arr = \[4, 2, 7, 1, 9\]/.test(code) && /target = 7/.test(code))
    return makeLinearSearchTrace(lines, language);
  if (/arr = \[5, 3, 1, 4\]/.test(code) && /arr\[j\], arr\[j \+ 1\]/.test(code))
    return makeBubbleSortTrace(lines, language);
  if (/def factorial/.test(code) && /factorial\(5\)/.test(code))
    return makeFactorialTrace(lines, language);
  if (/a = 10/.test(code) && /b = 20/.test(code) && /print\(msg\)/.test(code))
    return makeSumTrace(lines, language);
  if (/arr = \[3, 9, 1, 7\]/.test(code))
    return makeArrayMaxTrace(lines, language);
  if (/left,\s*right = 0,\s*len\(arr\) - 1/.test(code) && /target =/.test(code))
    return makeTwoPointerTrace(lines, code, language);
  if (/n = 7/.test(code) && /a,\s*b = 0,\s*1/.test(code))
    return makeFibTrace(lines, language);
  return makeFallbackTrace(lines, language);
}

function makeSumTrace(lines: string[], language: Language): Trace {
  const patterns =
    language === "java"
      ? {
          a: /int a = 10/,
          b: /int b = 20/,
          sum: /int sum = a \+ b/,
          msg: /String msg/,
          print: /System\.out\.println/,
        }
      : {
          a: /a = 10/,
          b: /b = 20/,
          sum: /total = a \+ b/,
          msg: /msg =/,
          print: /print\(msg\)/,
        };

  return {
    title: "합계 계산",
    code: lines.join("\n"),
    language,
    snapshots: [
      {
        line: lineOf(lines, patterns.a),
        stack: [{ name: "a", type: "int", value: "10" }],
        heap: [],
        output: "",
        note: "변수 a = 10 초기화",
      },
      {
        line: lineOf(lines, patterns.b),
        stack: [
          { name: "a", type: "int", value: "10" },
          { name: "b", type: "int", value: "20" },
        ],
        heap: [],
        output: "",
        note: "변수 b = 20 초기화",
      },
      {
        line: lineOf(lines, patterns.sum),
        stack: [
          { name: "a", type: "int", value: "10" },
          { name: "b", type: "int", value: "20" },
          { name: "sum", type: "int", value: "30" },
        ],
        heap: [],
        output: "",
        note: "sum = a + b = 30 계산",
      },
      {
        line: lineOf(lines, patterns.msg),
        stack: [
          { name: "a", type: "int", value: "10" },
          { name: "b", type: "int", value: "20" },
          { name: "sum", type: "int", value: "30" },
          { name: "msg", type: "String", value: "-> 0xA1" },
        ],
        heap: [{ addr: "0xA1", type: "String", value: '"sum=30"' }],
        output: "",
        note: "문자열 생성 후 참조값 저장",
      },
      {
        line: lineOf(lines, patterns.print),
        stack: [
          { name: "a", type: "int", value: "10" },
          { name: "b", type: "int", value: "20" },
          { name: "sum", type: "int", value: "30" },
          { name: "msg", type: "String", value: "-> 0xA1" },
        ],
        heap: [{ addr: "0xA1", type: "String", value: '"sum=30"' }],
        output: "sum=30",
        note: "출력 완료",
      },
    ],
  };
}

function makeArrayMaxTrace(lines: string[], language: Language): Trace {
  const patterns =
    language === "java"
      ? {
          arr: /int\[\] arr/,
          max: /int max = arr\[0\]/,
          ifMax: /if \(arr\[i\] > max\)/,
          loop: /for \(int i/,
          print: /System\.out\.println/,
        }
      : {
          arr: /arr = \[/,
          max: /max_val = arr\[0\]/,
          ifMax: /if arr\[i\] > max_val/,
          loop: /for i in range/,
          print: /print\(max_val\)/,
        };

  return {
    title: "배열 최댓값",
    code: lines.join("\n"),
    language,
    snapshots: [
      {
        line: lineOf(lines, patterns.arr),
        stack: [{ name: "arr", type: "int[]", value: "-> 0xB1" }],
        heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }],
        output: "",
        note: "배열 생성",
      },
      {
        line: lineOf(lines, patterns.max),
        stack: [
          { name: "arr", type: "int[]", value: "-> 0xB1" },
          { name: "max", type: "int", value: "3" },
        ],
        heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }],
        output: "",
        note: "max 초기화",
      },
      {
        line: lineOf(lines, patterns.ifMax),
        stack: [
          { name: "arr", type: "int[]", value: "-> 0xB1" },
          { name: "max", type: "int", value: "9" },
          { name: "i", type: "int", value: "1" },
        ],
        heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }],
        output: "",
        note: "i=1에서 max 갱신",
      },
      {
        line: lineOf(lines, patterns.loop),
        stack: [
          { name: "arr", type: "int[]", value: "-> 0xB1" },
          { name: "max", type: "int", value: "9" },
          { name: "i", type: "int", value: "2" },
        ],
        heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }],
        output: "",
        note: "i=2 비교 후 유지",
      },
      {
        line: lineOf(lines, patterns.loop),
        stack: [
          { name: "arr", type: "int[]", value: "-> 0xB1" },
          { name: "max", type: "int", value: "9" },
          { name: "i", type: "int", value: "3" },
        ],
        heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }],
        output: "",
        note: "i=3 비교 후 유지",
      },
      {
        line: lineOf(lines, patterns.print),
        stack: [
          { name: "arr", type: "int[]", value: "-> 0xB1" },
          { name: "max", type: "int", value: "9" },
        ],
        heap: [{ addr: "0xB1", type: "int[]", value: "[3, 9, 1, 7]" }],
        output: "9",
        note: "최댓값 출력",
      },
    ],
  };
}

function makeTwoPointerTrace(
  lines: string[],
  code: string,
  language: Language,
): Trace {
  const arrMatch =
    language === "java"
      ? code.match(/int\[\] arr = \{([^}]+)\}/)
      : code.match(/arr = \[([^\]]+)\]/);
  const targetMatch =
    language === "java"
      ? code.match(/int target = (\d+)/)
      : code.match(/target = (\d+)/);
  const rawArr = arrMatch
    ? arrMatch[1]
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : [1, 2, 4, 7, 11];
  const target = targetMatch ? parseInt(targetMatch[1], 10) : 9;
  const arr = [...rawArr].sort((a, b) => a - b);
  const heap: HeapItem[] = [
    { addr: "0xC1", type: "int[]", value: `[${arr.join(", ")}]` },
  ];

  const snaps: Snapshot[] = [];
  let left = 0;
  let right = arr.length - 1;
  const whileLine =
    language === "java"
      ? lineOf(lines, /while \(left < right\)/)
      : lineOf(lines, /while left < right/);
  const sumLine =
    language === "java"
      ? lineOf(lines, /int sum = arr\[left\]/)
      : lineOf(lines, /total = arr\[left\] \+ arr\[right\]/);
  const breakLine =
    language === "java"
      ? lineOf(lines, /if \(sum == target\)/)
      : lineOf(lines, /if total == target/);
  const leftLine =
    language === "java"
      ? lineOf(lines, /if \(sum < target\)/)
      : lineOf(lines, /if total < target/);
  const rightLine =
    language === "java"
      ? lineOf(lines, /else right--/)
      : lineOf(lines, /right -= 1/);
  const printLine =
    language === "java"
      ? lineOf(lines, /System\.out\.println/)
      : lineOf(lines, /print/);

  const initPointerLine =
    language === "java"
      ? lineOf(lines, /int left = 0/)
      : lineOf(lines, /left,\s*right = 0,\s*len\(arr\) - 1/);
  const initTargetLine =
    language === "java"
      ? lineOf(lines, /int target/)
      : lineOf(lines, /target =/);

  snaps.push({
    line: initPointerLine,
    stack: [
      { name: "arr", type: "int[]", value: "-> 0xC1" },
      { name: "left", type: "int", value: "0" },
      { name: "right", type: "int", value: String(right) },
    ],
    heap,
    output: "",
    note: "left=0, right=" + right + " 초기화",
  });
  snaps.push({
    line: initTargetLine,
    stack: [
      { name: "arr", type: "int[]", value: "-> 0xC1" },
      { name: "left", type: "int", value: "0" },
      { name: "right", type: "int", value: String(right) },
      { name: "target", type: "int", value: String(target) },
    ],
    heap,
    output: "",
    note: "target = " + target,
  });

  let found = false;
  let iters = 0;
  void whileLine; // referenced for documentation
  while (left < right && iters++ < arr.length * 2) {
    const total = arr[left] + arr[right];
    snaps.push({
      line: sumLine,
      stack: [
        { name: "left", type: "int", value: String(left) },
        { name: "right", type: "int", value: String(right) },
        { name: "target", type: "int", value: String(target) },
        { name: "sum", type: "int", value: String(total) },
      ],
      heap,
      output: "",
      note: `arr[${left}]+arr[${right}] = ${arr[left]}+${arr[right]} = ${total}`,
    });
    if (total === target) {
      found = true;
      snaps.push({
        line: breakLine,
        stack: [
          { name: "left", type: "int", value: String(left) },
          { name: "right", type: "int", value: String(right) },
          { name: "sum", type: "int", value: String(total) },
        ],
        heap,
        output: "",
        note: `${total} == ${target} -> break`,
      });
      break;
    } else if (total < target) {
      snaps.push({
        line: leftLine,
        stack: [
          { name: "left", type: "int", value: String(left) },
          { name: "right", type: "int", value: String(right) },
          { name: "sum", type: "int", value: String(total) },
        ],
        heap,
        output: "",
        note: `${total} < ${target} -> left++`,
      });
      left++;
    } else {
      snaps.push({
        line: rightLine,
        stack: [
          { name: "left", type: "int", value: String(left) },
          { name: "right", type: "int", value: String(right) },
          { name: "sum", type: "int", value: String(total) },
        ],
        heap,
        output: "",
        note: `${total} > ${target} -> right--`,
      });
      right--;
    }
  }
  const outputStr = found ? `${left},${right}` : "-1,-1";
  snaps.push({
    line: printLine,
    stack: [
      { name: "left", type: "int", value: String(left) },
      { name: "right", type: "int", value: String(right) },
    ],
    heap,
    output: outputStr,
    note: found
      ? `인덱스 (${left}, ${right}): 값 ${arr[left]}, ${arr[right]}`
      : "답 없음 → -1,-1",
  });
  return {
    title: "투 포인터",
    code: lines.join("\n"),
    snapshots: snaps,
    language,
  };
}

function makeFibTrace(lines: string[], language: Language): Trace {
  const patterns =
    language === "java"
      ? {
          n: /int n = 7/,
          init: /int a = 0/,
          loop: /int tmp = a \+ b/,
          print: /System\.out\.println/,
        }
      : {
          n: /n = 7/,
          init: /a,\s*b = 0,\s*1/,
          loop: /a,\s*b = b,\s*a \+ b/,
          print: /print\(b\)/,
        };

  return {
    title: "피보나치",
    code: lines.join("\n"),
    language,
    snapshots: [
      {
        line: lineOf(lines, patterns.n),
        stack: [{ name: "n", type: "int", value: "7" }],
        heap: [],
        output: "",
        note: "n = 7 설정",
      },
      {
        line: lineOf(lines, patterns.init),
        stack: [
          { name: "n", type: "int", value: "7" },
          { name: "a", type: "int", value: "0" },
          { name: "b", type: "int", value: "1" },
        ],
        heap: [],
        output: "",
        note: "a,b 초기화",
      },
      {
        line: lineOf(lines, patterns.loop),
        stack: [
          { name: "n", type: "int", value: "7" },
          { name: "a", type: "int", value: "0" },
          { name: "b", type: "int", value: "1" },
          { name: "i", type: "int", value: "2" },
        ],
        heap: [],
        output: "",
        note: "반복 1회 진행",
      },
      {
        line: lineOf(lines, patterns.loop),
        stack: [
          { name: "n", type: "int", value: "7" },
          { name: "a", type: "int", value: "1" },
          { name: "b", type: "int", value: "2" },
          { name: "i", type: "int", value: "3" },
        ],
        heap: [],
        output: "",
        note: "반복 2회 진행",
      },
      {
        line: lineOf(lines, patterns.loop),
        stack: [
          { name: "n", type: "int", value: "7" },
          { name: "a", type: "int", value: "2" },
          { name: "b", type: "int", value: "3" },
          { name: "i", type: "int", value: "4" },
        ],
        heap: [],
        output: "",
        note: "반복 3회 진행",
      },
      {
        line: lineOf(lines, patterns.loop),
        stack: [
          { name: "n", type: "int", value: "7" },
          { name: "a", type: "int", value: "5" },
          { name: "b", type: "int", value: "8" },
          { name: "i", type: "int", value: "6" },
        ],
        heap: [],
        output: "",
        note: "반복 5회 진행",
      },
      {
        line: lineOf(lines, patterns.loop),
        stack: [
          { name: "n", type: "int", value: "7" },
          { name: "a", type: "int", value: "8" },
          { name: "b", type: "int", value: "13" },
          { name: "i", type: "int", value: "7" },
        ],
        heap: [],
        output: "",
        note: "반복 종료 직전",
      },
      {
        line: lineOf(lines, patterns.print),
        stack: [
          { name: "n", type: "int", value: "7" },
          { name: "a", type: "int", value: "8" },
          { name: "b", type: "int", value: "13" },
        ],
        heap: [],
        output: "13",
        note: "F(7)=13 출력",
      },
    ],
  };
}

function makeFallbackTrace(lines: string[], language: Language): Trace {
  return {
    title: "코드 실행",
    code: lines.join("\n"),
    language,
    snapshots: [
      { line: 1, stack: [], heap: [], output: "", note: "실행 시작" },
      {
        line: Math.ceil(lines.length / 2),
        stack: [{ name: "...", type: "...", value: "..." }],
        heap: [],
        output: "",
        note: "중간 지점",
      },
      {
        line: lines.length,
        stack: [],
        heap: [],
        output: "// 완료",
        note: "실행 종료",
      },
    ],
  };
}

function makeLinearSearchTrace(lines: string[], language: Language): Trace {
  const heap: HeapItem[] = [
    { addr: "0xD1", type: "int[]", value: "[4, 2, 7, 1, 9]" },
  ];
  const arr = [4, 2, 7, 1, 9];
  const target = 7;
  const arrLine = lineOf(
    lines,
    language === "java" ? /int\[\] arr/ : /arr = \[/,
  );
  const targetLine = lineOf(
    lines,
    language === "java" ? /int target = 7/ : /target = 7/,
  );
  const indexLine = lineOf(
    lines,
    language === "java" ? /int index = -1/ : /index = -1/,
  );
  const loopLine = lineOf(
    lines,
    language === "java" ? /for \(int i/ : /for i in range/,
  );
  const ifLine = lineOf(
    lines,
    language === "java" ? /if \(arr\[i\] == target\)/ : /if arr\[i\] == target/,
  );
  const printLine = lineOf(
    lines,
    language === "java" ? /System\.out\.println/ : /print\(index\)/,
  );

  const snaps: Snapshot[] = [
    {
      line: arrLine,
      stack: [{ name: "arr", type: "int[]", value: "-> 0xD1" }],
      heap,
      output: "",
      note: "배열 [4, 2, 7, 1, 9] 생성",
    },
    {
      line: targetLine,
      stack: [
        { name: "arr", type: "int[]", value: "-> 0xD1" },
        { name: "target", type: "int", value: "7" },
      ],
      heap,
      output: "",
      note: "target = 7 설정",
    },
    {
      line: indexLine,
      stack: [
        { name: "arr", type: "int[]", value: "-> 0xD1" },
        { name: "target", type: "int", value: "7" },
        { name: "index", type: "int", value: "-1" },
      ],
      heap,
      output: "",
      note: "index = -1 초기화 (못 찾은 상태)",
    },
  ];

  for (let i = 0; i < arr.length; i++) {
    snaps.push({
      line: loopLine,
      stack: [
        { name: "arr", type: "int[]", value: "-> 0xD1" },
        { name: "target", type: "int", value: "7" },
        { name: "index", type: "int", value: "-1" },
        { name: "i", type: "int", value: String(i) },
      ],
      heap,
      output: "",
      note: `i=${i} 순회 중, arr[${i}]=${arr[i]}`,
    });
    snaps.push({
      line: ifLine,
      stack: [
        { name: "arr", type: "int[]", value: "-> 0xD1" },
        { name: "target", type: "int", value: "7" },
        { name: "index", type: "int", value: i === 2 ? "2" : "-1" },
        { name: "i", type: "int", value: String(i) },
      ],
      heap,
      output: "",
      note: `arr[${i}](${arr[i]}) == ${target} ? ${arr[i] === target ? "✅ 찾음 → break" : "❌"}`,
    });
    if (arr[i] === target) break;
  }

  snaps.push({
    line: printLine,
    stack: [
      { name: "arr", type: "int[]", value: "-> 0xD1" },
      { name: "target", type: "int", value: "7" },
      { name: "index", type: "int", value: "2" },
    ],
    heap,
    output: "2",
    note: "index=2 출력 (arr[2]=7)",
  });
  return {
    title: "선형 탐색",
    code: lines.join("\n"),
    snapshots: snaps,
    language,
  };
}

function makeBubbleSortTrace(lines: string[], language: Language): Trace {
  const arr = [5, 3, 1, 4];
  const outerLine = lineOf(
    lines,
    language === "java" ? /for \(int i = 0/ : /for i in range\(n - 1\)/,
  );
  const innerLine = lineOf(
    lines,
    language === "java" ? /for \(int j = 0/ : /for j in range\(n - 1 - i\)/,
  );
  const ifLine = lineOf(
    lines,
    language === "java"
      ? /if \(arr\[j\] > arr\[j \+ 1\]\)/
      : /if arr\[j\] > arr\[j \+ 1\]/,
  );
  const swapLine = lineOf(
    lines,
    language === "java" ? /int tmp = arr\[j\]/ : /arr\[j\], arr\[j \+ 1\]/,
  );
  const printLine = lineOf(
    lines,
    language === "java" ? /System\.out\.println/ : /print\("/,
  );

  const snaps: Snapshot[] = [];
  const a = [...arr];

  snaps.push({
    line: outerLine,
    stack: [
      { name: "arr", type: "int[]", value: "-> 0xE1" },
      { name: "n", type: "int", value: "4" },
    ],
    heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }],
    output: "",
    note: `정렬 시작: [${a.join(", ")}]`,
  });

  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      snaps.push({
        line: innerLine,
        stack: [
          { name: "arr", type: "int[]", value: "-> 0xE1" },
          { name: "i", type: "int", value: String(i) },
          { name: "j", type: "int", value: String(j) },
        ],
        heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }],
        output: "",
        note: `i=${i}, j=${j} 비교: arr[${j}]=${a[j]} vs arr[${j + 1}]=${a[j + 1]}`,
      });
      snaps.push({
        line: ifLine,
        stack: [
          { name: "arr", type: "int[]", value: "-> 0xE1" },
          { name: "i", type: "int", value: String(i) },
          { name: "j", type: "int", value: String(j) },
        ],
        heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }],
        output: "",
        note: `${a[j]} > ${a[j + 1]} ? ${a[j] > a[j + 1] ? "✅ swap" : "❌ 유지"}`,
      });
      if (a[j] > a[j + 1]) {
        const tmp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = tmp;
        snaps.push({
          line: swapLine,
          stack: [
            { name: "arr", type: "int[]", value: "-> 0xE1" },
            { name: "i", type: "int", value: String(i) },
            { name: "j", type: "int", value: String(j) },
            { name: "tmp", type: "int", value: String(tmp) },
          ],
          heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }],
          output: "",
          note: `swap → [${a.join(", ")}]`,
        });
      }
    }
  }

  snaps.push({
    line: printLine,
    stack: [{ name: "arr", type: "int[]", value: "-> 0xE1" }],
    heap: [{ addr: "0xE1", type: "int[]", value: `[${a.join(", ")}]` }],
    output: a.join(","),
    note: `정렬 완료: [${a.join(", ")}]`,
  });
  return {
    title: "버블 정렬",
    code: lines.join("\n"),
    snapshots: snaps,
    language,
  };
}

function makeFactorialTrace(lines: string[], language: Language): Trace {
  const baseLine = lineOf(
    lines,
    language === "java" ? /if \(n <= 1\)/ : /if n <= 1/,
  );
  const returnRecLine = lineOf(
    lines,
    language === "java" ? /return n \* factorial/ : /return n \* factorial/,
  );
  const mainCallLine = lineOf(
    lines,
    language === "java"
      ? /int result = factorial\(5\)/
      : /result = factorial\(5\)/,
  );
  const printLine = lineOf(
    lines,
    language === "java" ? /System\.out\.println/ : /print\(result\)/,
  );

  const snaps: Snapshot[] = [
    {
      line: mainCallLine,
      stack: [{ name: "[main]", type: "frame", value: "result=?" }],
      heap: [],
      output: "",
      note: "factorial(5) 호출",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
      ],
      heap: [],
      output: "",
      note: "factorial(5) → 5 * factorial(4)",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
        { name: "[factorial]", type: "frame", value: "n=4" },
      ],
      heap: [],
      output: "",
      note: "factorial(4) → 4 * factorial(3)",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
        { name: "[factorial]", type: "frame", value: "n=4" },
        { name: "[factorial]", type: "frame", value: "n=3" },
      ],
      heap: [],
      output: "",
      note: "factorial(3) → 3 * factorial(2)",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
        { name: "[factorial]", type: "frame", value: "n=4" },
        { name: "[factorial]", type: "frame", value: "n=3" },
        { name: "[factorial]", type: "frame", value: "n=2" },
      ],
      heap: [],
      output: "",
      note: "factorial(2) → 2 * factorial(1)",
    },
    {
      line: baseLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
        { name: "[factorial]", type: "frame", value: "n=4" },
        { name: "[factorial]", type: "frame", value: "n=3" },
        { name: "[factorial]", type: "frame", value: "n=2" },
        { name: "[factorial]", type: "frame", value: "n=1" },
      ],
      heap: [],
      output: "",
      note: "n=1 → base case: return 1",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
        { name: "[factorial]", type: "frame", value: "n=4" },
        { name: "[factorial]", type: "frame", value: "n=3" },
        { name: "[factorial]", type: "frame", value: "n=2 → return 2" },
      ],
      heap: [],
      output: "",
      note: "factorial(2) = 2 * 1 = 2 반환",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
        { name: "[factorial]", type: "frame", value: "n=4" },
        { name: "[factorial]", type: "frame", value: "n=3 → return 6" },
      ],
      heap: [],
      output: "",
      note: "factorial(3) = 3 * 2 = 6 반환",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5" },
        { name: "[factorial]", type: "frame", value: "n=4 → return 24" },
      ],
      heap: [],
      output: "",
      note: "factorial(4) = 4 * 6 = 24 반환",
    },
    {
      line: returnRecLine,
      stack: [
        { name: "[main]", type: "frame", value: "result=?" },
        { name: "[factorial]", type: "frame", value: "n=5 → return 120" },
      ],
      heap: [],
      output: "",
      note: "factorial(5) = 5 * 24 = 120 반환",
    },
    {
      line: printLine,
      stack: [{ name: "[main]", type: "frame", value: "result=120" }],
      heap: [],
      output: "120",
      note: "result=120 출력",
    },
  ];

  return {
    title: "팩토리얼 (재귀)",
    code: lines.join("\n"),
    snapshots: snaps,
    language,
  };
}

// ─────────────────────────────────────────────
// VS Code-like window chrome wrapper
// ─────────────────────────────────────────────
function VsCodeWindow({
  fileName,
  language,
  lineCount,
  children,
}: {
  fileName: string;
  language: string;
  lineCount: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl"
      style={{ background: "#1e1e1e" }}
    >
      {/* Title bar */}
      <div
        className="flex h-9 items-center gap-0 border-b px-3"
        style={{ background: "#323233", borderColor: "rgba(255,255,255,0.08)" }}
      >
        {/* Mac traffic lights */}
        <div className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: "#ff5f57" }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: "#febc2e" }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: "#28c840" }}
          />
        </div>
        {/* Window title */}
        <span className="flex-1 text-center text-[12px] text-slate-400">
          {fileName}
        </span>
        <div className="w-10" />
      </div>

      {/* Tab bar */}
      <div
        className="flex items-end border-b"
        style={{ background: "#2d2d2d", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-center gap-2 border-r border-t border-white/[0.08] px-4 py-1.5"
          style={{ background: "#1e1e1e", borderTopColor: "#3B82F6" }}
        >
          {/* Java icon dot */}
          <span className="h-2 w-2 rounded-full bg-orange-400/80" />
          <span className="text-[12px] text-slate-200">{fileName}</span>
          <span
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-sm text-[10px] text-slate-500 transition hover:bg-white/10 hover:text-slate-300"
            title="닫기"
          >
            ✕
          </span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Editor content */}
      <div className="flex-1">{children}</div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-0.5 text-[11px]"
        style={{ background: "#3B82F6" }}
      >
        <div className="flex items-center gap-3 text-white/80">
          <span>⑂ main</span>
          <span>⚠ 0</span>
        </div>
        <div className="flex items-center gap-4 text-white/80">
          <span>Ln {lineCount}</span>
          <span>UTF-8</span>
          <span>{language}</span>
          <span>CodeFlow</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export function TestLab({
  problem: problemProp,
  isAlgorithm = false,
}: {
  problem?: Problem;
  isAlgorithm?: boolean;
}) {
  const router = useRouter();
  const DUMMY_PROBLEM =
    problemProp ??
    (isAlgorithm ? DUMMY_PROBLEM_ALGORITHM : DUMMY_PROBLEM_ALGORITHM);

  const [phase, setPhase] = useState<"editor" | "loading" | "result">("editor");
  const [editorCode, setEditorCode] = useState(
    () => problemProp?.startCode ?? JAVA_DEFAULT_CODE,
  );
  const [trace, setTrace] = useState<Trace | null>(null);

  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    createInitialChatMessages,
  );
  const [chatInput, setChatInput] = useState("");
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [editorStatus, setEditorStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [editorOutput, setEditorOutput] = useState(
    "실행 버튼을 누르면 결과가 여기에 표시됩니다.",
  );
  const [leftPanelWidth, setLeftPanelWidth] = useState(440);
  const [rightPanelWidth, setRightPanelWidth] = useState(360);
  const [outputPanelHeight, setOutputPanelHeight] = useState(140);
  const [submissionReview, setSubmissionReview] =
    useState<SubmissionReview | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Visualizer state
  const [snapshotIndex, setSnapshotIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(750);
  const codeRef = useRef<HTMLDivElement>(null);
  const resizeStateRef = useRef<{
    panel: "left" | "right";
    startX: number;
    startLeftWidth: number;
    startRightWidth: number;
  } | null>(null);
  const outputResizeRef = useRef<{
    startY: number;
    startHeight: number;
  } | null>(null);

  const maxIndex = (trace?.snapshots.length ?? 1) - 1;

  // 채점 결과 페이지에서 브라우저 뒤로가기 차단
  useEffect(() => {
    if (phase !== "result") return;
    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [phase]);

  const lineCount = editorCode.split("\n").length;
  const MONACO_LINE_HEIGHT = 20;
  const languageLabel = "Java";
  const fileName = "Main.java";
  const studyLayoutStyle = {
    ["--study-layout" as any]: `${leftPanelWidth}px ${RESIZER_WIDTH}px minmax(0, 1fr) ${RESIZER_WIDTH}px ${rightPanelWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    if (!isRunning || !trace) return;
    if (snapshotIndex >= maxIndex) {
      setIsRunning(false);
      return;
    }
    const id = window.setTimeout(
      () => setSnapshotIndex((p) => Math.min(p + 1, maxIndex)),
      speed,
    );
    return () => window.clearTimeout(id);
  }, [isRunning, snapshotIndex, maxIndex, speed, trace]);

  useEffect(() => {
    if (!codeRef.current) return;
    const el = codeRef.current.querySelector(
      "[data-active='true']",
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [snapshotIndex]);

  useEffect(() => {
    return () => {
      resizeStateRef.current = null;
      outputResizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const startPanelResize =
    (panel: "left" | "right") => (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      resizeStateRef.current = {
        panel,
        startX: event.clientX,
        startLeftWidth: leftPanelWidth,
        startRightWidth: rightPanelWidth,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const state = resizeStateRef.current;
        if (!state) return;

        const delta = moveEvent.clientX - state.startX;
        const nextLeftWidth =
          state.panel === "left"
            ? state.startLeftWidth + delta
            : state.startLeftWidth;
        const nextRightWidth =
          state.panel === "right"
            ? state.startRightWidth - delta
            : state.startRightWidth;

        const viewportWidth = window.innerWidth;
        const maxLeftWidth = Math.max(
          LEFT_PANEL_MIN_WIDTH,
          viewportWidth -
            nextRightWidth -
            EDITOR_PANEL_MIN_WIDTH -
            RESIZER_WIDTH * 2,
        );
        const maxRightWidth = Math.max(
          RIGHT_PANEL_MIN_WIDTH,
          viewportWidth -
            nextLeftWidth -
            EDITOR_PANEL_MIN_WIDTH -
            RESIZER_WIDTH * 2,
        );

        if (state.panel === "left") {
          setLeftPanelWidth(
            Math.max(
              LEFT_PANEL_MIN_WIDTH,
              Math.min(nextLeftWidth, maxLeftWidth),
            ),
          );
        } else {
          setRightPanelWidth(
            Math.max(
              RIGHT_PANEL_MIN_WIDTH,
              Math.min(nextRightWidth, maxRightWidth),
            ),
          );
        }
      };

      const stopResize = () => {
        resizeStateRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopResize);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopResize);
    };

  const startOutputResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    outputResizeRef.current = {
      startY: event.clientY,
      startHeight: outputPanelHeight,
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = outputResizeRef.current;
      if (!state) return;

      const delta = moveEvent.clientY - state.startY;
      const viewportMax = Math.min(
        OUTPUT_PANEL_MAX_HEIGHT,
        Math.max(
          OUTPUT_PANEL_MIN_HEIGHT,
          Math.floor(window.innerHeight * 0.35),
        ),
      );
      const nextHeight = Math.max(
        OUTPUT_PANEL_MIN_HEIGHT,
        Math.min(state.startHeight - delta, viewportMax),
      );
      setOutputPanelHeight(nextHeight);
    };

    const stopResize = () => {
      outputResizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
  };

  const handleSubmit = async () => {
    setSubmissionReview(null);
    setPhase("loading");
    try {
      const res = await fetch("/api/v1/problems/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: DUMMY_PROBLEM.problemId,
          sourceCode: editorCode,
        }),
      });
      const json = await res.json();
      const result = json?.data;
      const passed: boolean = result?.passed ?? false;
      const output: string = result?.programOutput ?? "";
      const expected: string = result?.expectedOutput ?? "";

      setTestResults([
        {
          input: DUMMY_PROBLEM.examples[0]?.input ?? "",
          expected,
          actual: output,
          passed,
        },
      ]);
      setSubmissionReview(
        passed
          ? {
              passed: true,
              title: "정답이에요",
              feedback:
                "코드가 예상 출력과 일치합니다. 시각화로 실행 흐름을 확인해보세요.",
              nextHint: "",
            }
          : {
              passed: false,
              title: "아직 한 단계만 더",
              feedback: `예상 출력: "${expected}" / 실제 출력: "${output}"`,
              nextHint: "출력 형식을 다시 확인해보세요.",
            },
      );
      if (passed) {
        setTrace(generateTrace(editorCode, "java"));
      }
      setPhase("result");
    } catch {
      setPhase("editor");
    }
  };

  const handleEditCode = () => {
    setIsRunning(false);
    setPhase("editor");
    setTestResults(null);
  };

  const handleNextProblem = () => {
    setEditorCode(DUMMY_PROBLEM.startCode ?? JAVA_DEFAULT_CODE);
    setTrace(null);
    setPhase("editor");
    setIsRunning(false);
    setSnapshotIndex(0);
    setTestResults(null);
    setEditorStatus("idle");
    setEditorOutput("실행 버튼을 누르면 결과가 여기에 표시됩니다.");
    setSubmissionReview(null);
  };

  const handleGoHome = () => {
    setShowExitModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitModal(false);
    router.push("/");
  };

  const addChatMessage = (role: ChatMessage["role"], content: string) => {
    setChatMessages((current) => [...current, { role, content }]);
  };

  const handleSendMessage = async (message?: string) => {
    const nextMessage = (message ?? chatInput).trim();
    if (!nextMessage) return;

    addChatMessage("user", nextMessage);
    setChatInput("");
    setIsTutorLoading(true);

    try {
      const res = await fetch("/api/v1/problems/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: DUMMY_PROBLEM.title,
          difficulty: DUMMY_PROBLEM.difficulty,
          problem: DUMMY_PROBLEM.description,
          userCode: editorCode,
          question: nextMessage,
        }),
      });
      const text = await res.text();
      addChatMessage(
        "ai",
        text || "힌트를 가져오지 못했어요. 다시 시도해보세요.",
      );
    } catch {
      addChatMessage(
        "ai",
        "AI 튜터 연결에 실패했어요. 잠시 후 다시 시도해보세요.",
      );
    } finally {
      setIsTutorLoading(false);
    }
  };

  const handleRunPreview = async () => {
    setEditorStatus("running");
    setEditorOutput("실행 중...");

    try {
      const res = await fetch("/api/dockertracker/trace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode: editorCode }),
      });
      const json = await res.json();
      const output: string = json?.data?.answerCheck?.programOutput ?? "";
      if (!res.ok || json?.success === false) {
        setEditorStatus("error");
        setEditorOutput(output || "컴파일 오류가 발생했어요.");
        return;
      }
      setEditorStatus("success");
      setEditorOutput(output || "(출력 없음)");
    } catch {
      setEditorStatus("error");
      setEditorOutput("실행 서버에 연결할 수 없어요.");
    }
  };

  // ── LOADING PHASE ────────────────────────────
  if (phase === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg text-slate-50">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue opacity-25" />
          <span className="relative inline-flex h-10 w-10 rounded-full bg-gradient-to-br from-blue to-purple" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">채점 중…</p>
          <p className="mt-1 text-sm text-slate-400">
            테스트 케이스를 실행하고 있습니다
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-blue/60"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </main>
    );
  }

  // ── EDITOR PHASE ─────────────────────────────
  if (phase === "editor") {
    const outputLabel =
      editorStatus === "running"
        ? "실행 중..."
        : editorStatus === "success"
          ? "실행 완료"
          : editorStatus === "error"
            ? "오류"
            : "출력";

    return (
      <main className="min-h-screen bg-[#0b0f1a] text-slate-50">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.12),_transparent_28%)]" />
          <header className="relative z-10 border-b border-white/10 bg-[#0b0f1a]/95 backdrop-blur-xl">
            <div className="flex h-[52px] items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-5">
                <Link
                  href="/"
                  className="font-mono text-base font-bold tracking-tight text-white"
                >
                  Code
                  <span className="bg-gradient-to-r from-blue to-purple bg-clip-text text-transparent">
                    Flow
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] ${DIFFICULTY_COLOR[DUMMY_PROBLEM.difficulty]}`}
                >
                  {DUMMY_PROBLEM.difficulty.toUpperCase?.() ??
                    DUMMY_PROBLEM.difficulty}
                </span>
              </div>
            </div>
          </header>

          <div
            className="relative z-10 grid h-[calc(100vh-92px)] min-h-0 grid-cols-1 overflow-hidden xl:[grid-template-columns:var(--study-layout)]"
            style={studyLayoutStyle}
          >
            <aside className="min-h-0 overflow-hidden border-r border-white/10 bg-[#0b0f1a]/70">
              <div className="flex h-11 items-center justify-between border-b border-white/10 bg-[#1f2937] px-4">
                <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  문제
                </span>
              </div>
              <div className="h-[calc(100%-44px)] space-y-5 overflow-y-auto p-4 pb-8">
                <div>
                  <h1 className="text-lg font-semibold text-white">
                    {DUMMY_PROBLEM.title}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${DIFFICULTY_COLOR[DUMMY_PROBLEM.difficulty]}`}
                    >
                      {DUMMY_PROBLEM.difficulty}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {DUMMY_PROBLEM.description}
                  </p>
                </div>

                <section>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    입력 / 출력 예시
                  </p>
                  {DUMMY_PROBLEM.examples.slice(0, 1).map((example, index) => (
                    <div key={index} className="space-y-2">
                      <div className="rounded-xl bg-[#1f2937] p-3 font-mono text-xs text-slate-300">
                        <p className="mb-1 text-[10px] text-slate-500">입력</p>
                        <p className="whitespace-pre-wrap text-cyan-400">
                          {example.input}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#1f2937] p-3 font-mono text-xs text-slate-300">
                        <p className="mb-1 text-[10px] text-slate-500">출력</p>
                        <p className="text-cyan-400">{example.expected}</p>
                      </div>
                    </div>
                  ))}
                </section>

                <section>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    제한 사항
                  </p>
                  <ul className="space-y-2 pl-4 text-sm leading-6 text-slate-300">
                    {DUMMY_PROBLEM.constraints.map((constraint) => (
                      <li key={constraint} className="list-disc">
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    힌트
                  </p>
                  <div className="rounded-xl border-l-4 border-yellow-400 bg-[#1f2937] px-4 py-3 text-sm leading-6 text-slate-300">
                    {DUMMY_PROBLEM.hint ??
                      "문제를 풀다가 막히면 AI 튜터에게 질문해보세요."}
                  </div>
                </section>

                <section>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    지원 문법
                  </p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {SUPPORTED_SYNTAX_BY_LANGUAGE.java.map((item) => (
                      <li key={item} className="flex gap-1.5">
                        <span className="text-blue/60">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </aside>

            <div
              className="hidden touch-none select-none xl:flex"
              onPointerDown={startPanelResize("left")}
            >
              <div className="flex w-full cursor-col-resize items-stretch justify-center bg-[#0b0f1a]/70 transition-colors hover:bg-white/5">
                <div className="my-4 w-px rounded-full bg-white/15" />
              </div>
            </div>

            <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/10 bg-[#111827]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-md border px-2.5 py-1 font-mono text-[11px] ${"java" === "java" ? "border-orange-400/35 bg-orange-400/10 text-orange-300" : "border-yellow-400/35 bg-yellow-400/10 text-yellow-300"}`}
                  >
                    {languageLabel}
                  </span>
                  <span className="hidden font-mono text-xs text-slate-500 sm:inline">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunPreview}
                    className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-400/15"
                  >
                    ▷ 실행
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="rounded-md bg-gradient-to-r from-blue to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    ▶ 제출 및 채점
                  </button>
                  <button
                    onClick={() => {
                      setEditorCode(
                        DUMMY_PROBLEM.startCode ?? JAVA_DEFAULT_CODE,
                      );
                      setEditorStatus("idle");
                      setEditorOutput(
                        "실행 버튼을 누르면 결과가 여기에 표시됩니다.",
                      );
                    }}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/25 hover:text-slate-200"
                  >
                    ↺ 초기화
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full min-h-0">
                  <MonacoEditor
                    height="100%"
                    language="java"
                    value={editorCode}
                    onChange={(val) => {
                      setEditorCode(val ?? "");
                      setTestResults(null);
                    }}
                    theme="vs-dark"
                    beforeMount={(monaco) => {
                      const CK = monaco.languages.CompletionItemKind;
                      const ITR =
                        monaco.languages.CompletionItemInsertTextRule
                          .InsertAsSnippet;

                      // Provider 1: 일반 타이핑 → 키워드·클래스명·스니펫
                      monaco.languages.registerCompletionItemProvider("java", {
                        provideCompletionItems(
                          model: Monaco.editor.ITextModel,
                          position: Monaco.Position,
                        ) {
                          const word = model.getWordUntilPosition(position);
                          const range = {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: word.startColumn,
                            endColumn: word.endColumn,
                          };
                          const kw = (label: string) => ({
                            label,
                            kind: CK.Keyword,
                            insertText: label,
                            range,
                          });
                          const cls = (label: string) => ({
                            label,
                            kind: CK.Class,
                            insertText: label,
                            range,
                          });
                          const snippet = (
                            label: string,
                            insert: string,
                            detail: string,
                          ) => ({
                            label,
                            kind: CK.Snippet,
                            insertText: insert,
                            insertTextRules: ITR,
                            detail,
                            range,
                          });
                          return {
                            suggestions: [
                              ...[
                                "public",
                                "private",
                                "protected",
                                "static",
                                "final",
                                "void",
                                "class",
                                "interface",
                                "extends",
                                "implements",
                                "new",
                                "return",
                                "if",
                                "else",
                                "for",
                                "while",
                                "do",
                                "break",
                                "continue",
                                "try",
                                "catch",
                                "finally",
                                "throw",
                                "throws",
                                "int",
                                "long",
                                "double",
                                "float",
                                "boolean",
                                "char",
                                "byte",
                                "short",
                                "true",
                                "false",
                                "null",
                                "this",
                                "super",
                                "import",
                                "package",
                              ].map(kw),
                              ...[
                                "System",
                                "String",
                                "Arrays",
                                "Math",
                                "Integer",
                                "Double",
                                "Boolean",
                                "Character",
                                "StringBuilder",
                                "Scanner",
                              ].map(cls),
                              snippet(
                                "main",
                                "public static void main(String[] args) {\n\t$0\n}",
                                "main 메서드",
                              ),
                              snippet(
                                "sout",
                                "System.out.println($0);",
                                "System.out.println",
                              ),
                              snippet(
                                "soutf",
                                'System.out.printf("$1%n"$0);',
                                "System.out.printf",
                              ),
                              snippet(
                                "fori",
                                "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}",
                                "for 루프",
                              ),
                              snippet(
                                "foreach",
                                "for (${1:Type} ${2:item} : ${3:collection}) {\n\t$0\n}",
                                "for-each 루프",
                              ),
                              snippet(
                                "while",
                                "while (${1:condition}) {\n\t$0\n}",
                                "while 루프",
                              ),
                              snippet(
                                "if",
                                "if (${1:condition}) {\n\t$0\n}",
                                "if 문",
                              ),
                              snippet(
                                "ife",
                                "if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}",
                                "if-else 문",
                              ),
                              snippet(
                                "class",
                                "public class ${1:ClassName} {\n\t$0\n}",
                                "클래스 선언",
                              ),
                              snippet(
                                "arr",
                                "int[] ${1:arr} = new int[${2:size}];",
                                "int 배열 선언",
                              ),
                              snippet(
                                "arrlit",
                                "int[] ${1:arr} = {$0};",
                                "int 배열 리터럴",
                              ),
                              snippet(
                                "method",
                                "public ${1:void} ${2:methodName}(${3}) {\n\t$0\n}",
                                "메서드 선언",
                              ),
                              snippet(
                                "trycatch",
                                "try {\n\t$1\n} catch (${2:Exception} e) {\n\t$0\n}",
                                "try-catch",
                              ),
                              snippet(
                                "swap",
                                "int ${1:tmp} = ${2:a};\n${2:a} = ${3:b};\n${3:b} = ${1:tmp};",
                                "swap",
                              ),
                            ],
                          };
                        },
                      });

                      // Provider 2: dot 트리거 → 컨텍스트별 멤버 제안
                      monaco.languages.registerCompletionItemProvider("java", {
                        triggerCharacters: ["."],
                        provideCompletionItems(
                          model: Monaco.editor.ITextModel,
                          position: Monaco.Position,
                        ) {
                          const lineText = model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                          });
                          // dot 직후 삽입 범위
                          const dotRange = {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endColumn: position.column,
                          };
                          const method = (
                            label: string,
                            insert: string,
                            detail: string,
                            r = dotRange,
                          ) => ({
                            label,
                            kind: CK.Method,
                            insertText: insert,
                            insertTextRules: ITR,
                            detail,
                            range: r,
                          });

                          // System. → out.println 등
                          if (/\bSystem\.$/.test(lineText)) {
                            return {
                              suggestions: [
                                method(
                                  "out.println",
                                  "out.println($0);",
                                  "표준 출력 후 줄바꿈",
                                ),
                                method(
                                  "out.print",
                                  "out.print($0);",
                                  "표준 출력",
                                ),
                                method(
                                  "out.printf",
                                  'out.printf("$1"$0);',
                                  "포맷 출력",
                                ),
                                method(
                                  "err.println",
                                  "err.println($0);",
                                  "표준 에러 출력",
                                ),
                                method("exit", "exit($0);", "프로그램 종료"),
                              ],
                            };
                          }

                          // System.out. → println 등
                          if (/\bSystem\.out\.$/.test(lineText)) {
                            return {
                              suggestions: [
                                method(
                                  "println",
                                  "println($0);",
                                  "출력 후 줄바꿈",
                                ),
                                method("print", "print($0);", "출력"),
                                method(
                                  "printf",
                                  'printf("$1"$0);',
                                  "포맷 출력",
                                ),
                              ],
                            };
                          }

                          // System.err. → println 등
                          if (/\bSystem\.err\.$/.test(lineText)) {
                            return {
                              suggestions: [
                                method(
                                  "println",
                                  "println($0);",
                                  "에러 출력 후 줄바꿈",
                                ),
                                method("print", "print($0);", "에러 출력"),
                              ],
                            };
                          }

                          // Arrays. → sort, fill, copyOf 등
                          if (/\bArrays\.$/.test(lineText)) {
                            return {
                              suggestions: [
                                method("sort", "sort($0);", "배열 정렬"),
                                method(
                                  "fill",
                                  "fill(${1:arr}, $0);",
                                  "배열 채우기",
                                ),
                                method(
                                  "copyOf",
                                  "copyOf(${1:arr}, $0);",
                                  "배열 복사",
                                ),
                                method(
                                  "toString",
                                  "toString($0)",
                                  "배열을 문자열로",
                                ),
                              ],
                            };
                          }

                          // Math. → abs, max, min 등
                          if (/\bMath\.$/.test(lineText)) {
                            return {
                              suggestions: [
                                method("abs", "abs($0)", "절댓값"),
                                method("max", "max($1, $0)", "최댓값"),
                                method("min", "min($1, $0)", "최솟값"),
                                method("pow", "pow($1, $0)", "거듭제곱"),
                                method("sqrt", "sqrt($0)", "제곱근"),
                                method("floor", "floor($0)", "내림"),
                                method("ceil", "ceil($0)", "올림"),
                                method("round", "round($0)", "반올림"),
                              ],
                            };
                          }

                          // String 변수. → length, charAt 등 (임의 식별자 뒤 dot)
                          if (/\w\.$/.test(lineText)) {
                            return {
                              suggestions: [
                                method("length", "length()", "길이"),
                                method("charAt", "charAt($0)", "인덱스 문자"),
                                method(
                                  "substring",
                                  "substring($0)",
                                  "부분 문자열",
                                ),
                                method("equals", "equals($0)", "문자열 비교"),
                                method("contains", "contains($0)", "포함 여부"),
                                method("replace", "replace($1, $0)", "치환"),
                                method("split", "split($0)", "분리"),
                                method("trim", "trim()", "공백 제거"),
                                method(
                                  "toUpperCase",
                                  "toUpperCase()",
                                  "대문자 변환",
                                ),
                                method(
                                  "toLowerCase",
                                  "toLowerCase()",
                                  "소문자 변환",
                                ),
                                method("indexOf", "indexOf($0)", "인덱스 탐색"),
                                method(
                                  "isEmpty",
                                  "isEmpty()",
                                  "빈 문자열 여부",
                                ),
                              ],
                            };
                          }

                          return { suggestions: [] };
                        },
                      });
                    }}
                    options={{
                      fontSize: 14,
                      lineHeight: MONACO_LINE_HEIGHT,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: "on",
                      roundedSelection: true,
                      padding: { top: 12, bottom: 12 },
                      tabSize: 2,
                      cursorBlinking: "smooth",
                      smoothScrolling: true,
                      automaticLayout: true,
                      contextmenu: true,
                      renderLineHighlight: "all",
                      bracketPairColorization: { enabled: true },
                    }}
                  />
                </div>
              </div>

              <div
                className="hidden touch-none select-none xl:flex"
                onPointerDown={startOutputResize}
              >
                <div className="flex h-[10px] w-full cursor-row-resize items-center justify-center bg-[#0f172a] transition-colors hover:bg-white/5">
                  <div className="h-px w-12 rounded-full bg-white/15" />
                </div>
              </div>

              <div
                className="border-t border-white/10"
                style={{ height: `${outputPanelHeight}px` }}
              >
                <div className="flex items-center gap-2 border-b border-white/10 bg-[#1f2937] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${editorStatus === "running" ? "bg-yellow-400" : editorStatus === "success" ? "bg-emerald-400" : editorStatus === "error" ? "bg-red-400" : "bg-slate-600"}`}
                  />
                  <span>{outputLabel}</span>
                </div>
                <div
                  className={`h-[calc(100%-41px)] overflow-y-auto px-4 py-3 font-mono text-sm leading-6 ${editorStatus === "success" ? "text-emerald-400" : editorStatus === "error" ? "text-red-400" : "text-slate-400"}`}
                >
                  {editorOutput}
                </div>
              </div>
            </section>

            <div
              className="hidden touch-none select-none xl:flex"
              onPointerDown={startPanelResize("right")}
            >
              <div className="flex w-full cursor-col-resize items-stretch justify-center bg-[#0b0f1a]/70 transition-colors hover:bg-white/5">
                <div className="my-4 w-px rounded-full bg-white/15" />
              </div>
            </div>

            <aside className="flex min-h-0 h-full flex-col overflow-hidden bg-[#0b0f1a]/80">
              <div className="flex h-11 items-center justify-between border-b border-white/10 bg-[#1f2937] px-4">
                <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  AI 튜터
                </span>
                <span className="text-[11px] text-emerald-400">● Gemini</span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${message.role === "ai" ? "bg-blue/20 text-blue" : "bg-purple/20 text-purple-300"}`}
                      >
                        {message.role === "ai" ? "AI" : "나"}
                      </div>
                      <div
                        className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 ${message.role === "ai" ? "rounded-bl-md bg-[#1f2937] text-slate-100" : "rounded-br-md border border-blue/20 bg-blue/10 text-slate-100"}`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isTutorLoading && (
                    <div className="flex gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue/20 text-[11px] font-bold text-blue">
                        AI
                      </div>
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-[#1f2937] px-4 py-3">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendMessage(prompt)}
                        className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-slate-400 transition hover:border-blue/35 hover:text-blue"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 p-4">
                  <div className="flex gap-2">
                    <textarea
                      rows={1}
                      value={chatInput}
                      disabled={isTutorLoading}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        isTutorLoading
                          ? "AI가 생각 중이에요..."
                          : "코드 작성 중 막히면 물어보세요..."
                      }
                      className="min-h-[42px] flex-1 resize-none rounded-xl border border-white/15 bg-[#1f2937] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue/40 disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isTutorLoading}
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-blue text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                    >
                      ↑
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="relative z-10 flex h-10 items-center justify-between border-t border-white/10 px-4 font-mono text-xs text-slate-500 sm:px-6">
            <div className="flex items-center gap-3">
              <span>{fileName}</span>
              <span>·</span>
              <span>{editorCode.length} chars</span>
            </div>
            <span>CodeFlow · {languageLabel}</span>
          </div>
        </div>
      </main>
    );
  }

  // ── RESULT PHASE ─────────────────────────────
  const passCount = testResults
    ? testResults.filter((r) => r.passed).length
    : 0;
  const totalCount = testResults ? testResults.length : 0;
  const review = submissionReview ?? {
    passed: false,
    title: "결과 없음",
    feedback: "",
    nextHint: "",
  };

  if (phase !== "result") return null;

  const resultPassed = review.passed;
  const resultToneClass = resultPassed
    ? "border-emerald-500/25 bg-emerald-500/[0.06]"
    : "border-yellow-500/25 bg-yellow-500/[0.06]";
  const resultLabelClass = resultPassed
    ? "text-emerald-400"
    : "text-yellow-400";
  const summaryClass =
    passCount === totalCount
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      : passCount === 0
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";

  return (
    <main className="min-h-screen bg-bg text-slate-50">
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-semibold text-white">
              메인으로 나가시겠어요?
            </h3>
            <p className="mb-6 text-sm text-slate-400">
              지금 나가면 현재 채점 결과가 사라집니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-white/30 hover:text-white"
              >
                취소
              </button>
              <button
                onClick={handleConfirmExit}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
          <button
            onClick={handleEditCode}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 transition hover:border-blue/50 hover:text-white"
          >
            ✏ 코드 수정
          </button>
          <span className="text-sm font-semibold tracking-wide text-blue">
            CodeFlow · 채점 결과
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${summaryClass}`}
          >
            {passCount} / {totalCount} 통과
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
        <div className={`mb-5 rounded-2xl border p-5 ${resultToneClass}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${resultLabelClass}`}
              >
                채점 결과
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                {review.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                {review.feedback}
              </p>
              <p className="mt-3 text-xs text-slate-500">{review.nextHint}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/study/visualization"
                className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
              >
                시각화 보기
              </Link>
              <Link
                href="/study/records"
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:border-blue/40 hover:text-white"
              >
                제출 기록 보기
              </Link>
              {resultPassed ? (
                <button
                  onClick={handleNextProblem}
                  className="rounded-xl bg-gradient-to-r from-blue to-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  다음 문제
                </button>
              ) : (
                <button
                  onClick={handleEditCode}
                  className="rounded-xl bg-gradient-to-r from-blue to-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  다시 풀기
                </button>
              )}
              <button
                onClick={handleGoHome}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:border-blue/40 hover:text-white"
              >
                메인으로
              </button>
            </div>
          </div>
        </div>

        {testResults && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">테스트 결과</p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${summaryClass}`}
                >
                  {passCount === totalCount ? "✓" : passCount === 0 ? "✗" : "△"}{" "}
                  {passCount} / {totalCount} 통과
                </span>
              </div>
              <button
                onClick={handleEditCode}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue/40 hover:text-white"
              >
                ✏ 코드 수정
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {testResults.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3.5 ${
                    r.passed
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : "border-red-500/25 bg-red-500/[0.06]"
                  }`}
                >
                  <p
                    className={`mb-3 text-xs font-bold ${r.passed ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {r.passed ? "✓" : "✗"} 테스트 {i + 1}
                  </p>
                  <div className="flex flex-col gap-2 text-[11px]">
                    <div>
                      <p className="mb-1 text-slate-500">입력</p>
                      <pre className="whitespace-pre-wrap rounded-lg bg-black/30 px-2.5 py-1.5 font-mono leading-5 text-slate-200">
                        {r.input}
                      </pre>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-slate-500">기댓값</p>
                        <pre className="rounded-lg bg-black/30 px-2.5 py-1.5 font-mono text-slate-200">
                          {r.expected}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 text-slate-500">실제 출력</p>
                        <pre
                          className={`rounded-lg px-2.5 py-1.5 font-mono ${
                            r.passed
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {r.actual}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
