"use client";

import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

// ─── Resize constants ─────────────────────────────────────
const CODE_MIN = 160;
const CODE_MAX = 500;
const AI_MIN   = 220;
const AI_MAX   = 520;
const STACK_MIN = 160;
const HEAP_MIN  = 160;
const DIVIDER_W = 8;

// ─── Types ────────────────────────────────────────────────
type VarEntry = { name: string; type: string; value: string };
type Frame = { label: string; vars: VarEntry[] };
type HeapEntry = { addr: string; typeLabel: string; rawValues: string };
type Snapshot = {
  step: number;
  line: number;
  frames: Frame[];
  heap: HeapEntry[];
  output: string;
  note: string;
  ai: string;
};
type ChatMessage = { role: "ai" | "user"; content: string };

// ─── Code ─────────────────────────────────────────────────
const CODE_LINES = [
  "public class Main {",
  "  public static void main(String[] args) {",
  "    int[] arr = {3, 9, 1, 7};",
  "    int max = arr[0];",
  "    for (int i = 1; i < arr.length; i++) {",
  "      if (arr[i] > max) max = arr[i];",
  "    }",
  "    System.out.println(max);",
  "  }",
  "}",
];

// ─── Snapshots ────────────────────────────────────────────
const SNAPSHOTS: Snapshot[] = [
  {
    step: 1,
    line: 3,
    frames: [
      {
        label: "Main.main",
        vars: [{ name: "arr", type: "int[]", value: "→ 0xB1" }],
      },
    ],
    heap: [{ addr: "0xB1", typeLabel: "int[4]", rawValues: "3, 9, 1, 7" }],
    output: "",
    note: "배열 {3, 9, 1, 7}이 힙에 생성되고, 스택의 arr 변수는 그 주소(0xB1)를 가리킵니다.",
    ai: "`arr`은 스택에 주소(0xB1)만 저장되고, 실제 배열 데이터는 힙에 있습니다. Java에서 배열은 객체이기 때문에 항상 힙에 할당됩니다.",
  },
  {
    step: 2,
    line: 4,
    frames: [
      {
        label: "Main.main",
        vars: [
          { name: "arr", type: "int[]", value: "→ 0xB1" },
          { name: "max", type: "int", value: "3" },
        ],
      },
    ],
    heap: [{ addr: "0xB1", typeLabel: "int[4]", rawValues: "3, 9, 1, 7" }],
    output: "",
    note: "arr[0]의 값 3이 max 변수로 복사됩니다.",
    ai: "`max = arr[0]`은 힙의 배열 첫 번째 원소 3을 스택의 `max`에 복사합니다. int는 기본형(primitive)이라 값 자체가 스택에 저장됩니다.",
  },
  {
    step: 3,
    line: 5,
    frames: [
      {
        label: "Main.main",
        vars: [
          { name: "arr", type: "int[]", value: "→ 0xB1" },
          { name: "max", type: "int", value: "3" },
          { name: "i", type: "int", value: "1" },
        ],
      },
    ],
    heap: [{ addr: "0xB1", typeLabel: "int[4]", rawValues: "3, 9, 1, 7" }],
    output: "",
    note: "for문이 시작되며 반복 변수 i=1이 스택 프레임에 추가됩니다.",
    ai: "for 초기화 `int i = 1`이 실행되어 `i`가 스택에 추가됩니다. 0이 아닌 1부터 시작하는 이유는 arr[0]이 이미 max의 초기값으로 쓰였기 때문입니다.",
  },
  {
    step: 4,
    line: 6,
    frames: [
      {
        label: "Main.main",
        vars: [
          { name: "arr", type: "int[]", value: "→ 0xB1" },
          { name: "max", type: "int", value: "9" },
          { name: "i", type: "int", value: "1" },
        ],
      },
    ],
    heap: [{ addr: "0xB1", typeLabel: "int[4]", rawValues: "3, 9, 1, 7" }],
    output: "",
    note: "arr[1]=9 > max=3이므로 조건이 참 → max가 9로 갱신됩니다.",
    ai: "i=1일 때 arr[1]=9가 max=3보다 크므로 `max = arr[i]`가 실행됩니다. 스택에서 max 값이 3 → 9로 바뀐 것을 확인하세요!",
  },
  {
    step: 5,
    line: 6,
    frames: [
      {
        label: "Main.main",
        vars: [
          { name: "arr", type: "int[]", value: "→ 0xB1" },
          { name: "max", type: "int", value: "9" },
          { name: "i", type: "int", value: "2" },
        ],
      },
    ],
    heap: [{ addr: "0xB1", typeLabel: "int[4]", rawValues: "3, 9, 1, 7" }],
    output: "",
    note: "arr[2]=1 < max=9이므로 조건이 거짓 → max는 유지됩니다.",
    ai: "arr[2]=1은 max=9보다 작으므로 if 조건이 false입니다. max는 그대로 9로 유지되고 반복이 계속됩니다.",
  },
  {
    step: 6,
    line: 6,
    frames: [
      {
        label: "Main.main",
        vars: [
          { name: "arr", type: "int[]", value: "→ 0xB1" },
          { name: "max", type: "int", value: "9" },
          { name: "i", type: "int", value: "3" },
        ],
      },
    ],
    heap: [{ addr: "0xB1", typeLabel: "int[4]", rawValues: "3, 9, 1, 7" }],
    output: "",
    note: "arr[3]=7 < max=9이므로 조건이 거짓 → 모든 원소 순회 완료.",
    ai: "마지막 원소 arr[3]=7도 max=9보다 작습니다. 모든 원소를 확인했으므로 for문이 종료됩니다.",
  },
  {
    step: 7,
    line: 8,
    frames: [
      {
        label: "Main.main",
        vars: [
          { name: "arr", type: "int[]", value: "→ 0xB1" },
          { name: "max", type: "int", value: "9" },
        ],
      },
    ],
    heap: [{ addr: "0xB1", typeLabel: "int[4]", rawValues: "3, 9, 1, 7" }],
    output: "9",
    note: "최댓값 9를 출력합니다. for문이 끝나 i 변수는 스코프를 벗어나 제거됩니다.",
    ai: "마지막 단계! `System.out.println(max)`가 9를 출력합니다. for 블록이 종료되어 `i`는 스택에서 사라진 상태입니다.",
  },
];

// ─── AI Quick Prompts & Responses ─────────────────────────
const QUICK_PROMPTS: Record<number, string[]> = {
  1: ["배열이 힙에 저장되는 이유?", "스택과 힙 차이?"],
  2: ["기본형은 왜 스택에?", "참조형 설명해주세요"],
  3: ["i가 1부터 시작하는 이유?", "for문 구조 설명"],
  4: ["max가 왜 바뀌었나요?", "비교 연산자 설명"],
  5: ["조건이 false이면?", "if문 동작 원리"],
  6: ["반복은 언제 끝나요?", "배열 인덱스 범위"],
  7: ["i가 사라진 이유?", "시간복잡도는?"],
};

const AI_RESPONSES: Record<string, string> = {
  "배열이 힙에 저장되는 이유?":
    "Java에서 배열은 객체(Object)로 취급됩니다. 객체는 크기가 동적이라 스택에 올릴 수 없어 힙에 저장됩니다. 스택에는 힙 주소(참조값)만 올라갑니다.",
  "스택과 힙 차이?":
    "스택은 메서드 호출/기본형을 관리하고 LIFO 구조입니다. 힙은 객체/배열을 저장하며 GC가 관리합니다. 스택은 빠르지만 크기가 제한적이고, 힙은 큰 대신 관리 비용이 있습니다.",
  "기본형은 왜 스택에?":
    "int, boolean 같은 기본형(primitive)은 크기가 고정되어 있어 스택에 값 자체를 직접 저장합니다. 반면 배열/객체는 크기가 가변적이라 힙에 두고 참조만 스택에 저장합니다.",
  "참조형 설명해주세요":
    "배열, String, 직접 만든 클래스가 참조형입니다. 스택의 변수에는 실제 데이터가 아닌 힙 주소(→ 0xB1 같은)가 들어 있고, 실제 데이터는 힙에 있습니다.",
  "i가 1부터 시작하는 이유?":
    "arr[0]은 이미 max의 초기값으로 사용했으므로 비교할 필요가 없습니다. i=1부터 시작하면 불필요한 비교 1회를 줄일 수 있어요.",
  "for문 구조 설명":
    "`for (초기화; 조건; 증감)` 순으로 실행됩니다. `int i = 1`(초기화) → `i < arr.length`(조건, false이면 종료) → `i++`(매 반복 후 증가).",
  "max가 왜 바뀌었나요?":
    "arr[1]=9가 현재 max=3보다 크므로 `arr[i] > max` 조건이 true입니다. 따라서 `max = arr[i]`가 실행되어 max가 9로 갱신됩니다.",
  "비교 연산자 설명":
    "`>`는 '크다'를 의미합니다. `arr[i] > max`는 arr[i]가 max보다 클 때 true입니다. 관련 연산자: `>`, `<`, `>=`, `<=`, `==`(같다), `!=`(다르다).",
  "조건이 false이면?":
    "if 조건이 false이면 블록 안 코드를 건너뜁니다. 이 경우 max는 변경되지 않고 i++로 넘어가 다음 반복이 시작됩니다.",
  "if문 동작 원리":
    "if (조건)이 true이면 블록 안 코드를 실행하고, false이면 건너뜁니다. else가 없으면 false 시 아무 작업도 하지 않습니다.",
  "반복은 언제 끝나요?":
    "`i < arr.length` 즉 `i < 4` 조건이 false가 되는 순간, 즉 i=4가 되면 반복이 끝납니다. i=3일 때가 마지막 반복(arr[3])입니다.",
  "배열 인덱스 범위":
    "배열의 유효 인덱스는 0부터 length-1까지입니다. arr.length=4이면 arr[0]~arr[3]이 유효하며, arr[4]에 접근하면 ArrayIndexOutOfBoundsException이 발생합니다.",
  "i가 사라진 이유?":
    "for문이 끝나면서 블록 스코프가 종료됩니다. `i`는 for 초기화 부분에서 선언됐으므로 for 블록이 끝나면 스택 프레임에서 제거됩니다.",
  "시간복잡도는?":
    "배열 최댓값을 찾으려면 모든 원소를 최소 한 번 확인해야 합니다. 따라서 최선/최악 모두 O(n)이며, 이미 최적 알고리즘을 사용하고 있습니다!",
};

// ─── Helpers ──────────────────────────────────────────────
function getChangedVars(current: Snapshot, prev: Snapshot | null): Set<string> {
  if (!prev) return new Set();
  const changed = new Set<string>();
  const prevVars = prev.frames.flatMap((f) => f.vars);
  for (const v of current.frames.flatMap((f) => f.vars)) {
    const p = prevVars.find((pv) => pv.name === v.name);
    if (!p || p.value !== v.value) changed.add(v.name);
  }
  return changed;
}

function getNewVars(current: Snapshot, prev: Snapshot | null): Set<string> {
  if (!prev) return new Set();
  const prevNames = new Set(prev.frames.flatMap((f) => f.vars).map((v) => v.name));
  return new Set(
    current.frames.flatMap((f) => f.vars).map((v) => v.name).filter((n) => !prevNames.has(n))
  );
}

function getActiveArrayIndex(vars: VarEntry[]): number | null {
  const iVar = vars.find((v) => v.name === "i");
  if (!iVar) return null;
  const n = parseInt(iVar.value);
  return isNaN(n) ? null : n;
}

// ─── Component ────────────────────────────────────────────
export default function VisualizationPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "배열 최댓값 찾기 알고리즘의 실행 과정을 단계별로 확인할 수 있어요. 스택과 힙 메모리가 어떻게 변하는지 살펴보세요!",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  // ── Panel widths (resizable) ────────────────────────────
  const [codePanelWidth,  setCodePanelWidth]  = useState(320);
  const [aiPanelWidth,    setAiPanelWidth]    = useState(320);
  const [stackPanelWidth, setStackPanelWidth] = useState(0); // 0 = measure on mount

  const resizeRef = useRef<{
    panel: "code" | "ai" | "stack";
    startX: number;
    startCode: number;
    startAi: number;
    startStack: number;
  } | null>(null);

  const codeRef    = useRef<HTMLDivElement>(null);
  const centerRef  = useRef<HTMLElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 마운트 시 중앙 패널 실제 너비 측정 → 스택/힙을 50:50으로 초기화
  useEffect(() => {
    if (!centerRef.current) return;
    const w = centerRef.current.getBoundingClientRect().width;
    if (w > 0) setStackPanelWidth(Math.floor((w - DIVIDER_W) / 2));
  }, []);

  const startResize =
    (panel: "code" | "ai" | "stack") =>
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      resizeRef.current = {
        panel,
        startX:     e.clientX,
        startCode:  codePanelWidth,
        startAi:    aiPanelWidth,
        startStack: stackPanelWidth,
      };
      document.body.style.cursor     = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (ev: PointerEvent) => {
        const s = resizeRef.current;
        if (!s) return;
        const d = ev.clientX - s.startX;
        if (s.panel === "code") {
          setCodePanelWidth(Math.max(CODE_MIN, Math.min(CODE_MAX, s.startCode + d)));
        } else if (s.panel === "ai") {
          setAiPanelWidth(Math.max(AI_MIN, Math.min(AI_MAX, s.startAi - d)));
        } else {
          setStackPanelWidth(Math.max(STACK_MIN, s.startStack + d));
        }
      };

      const onUp = () => {
        resizeRef.current = null;
        document.body.style.cursor     = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup",   onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup",   onUp);
    };

  useEffect(() => () => {
    resizeRef.current = null;
    document.body.style.cursor     = "";
    document.body.style.userSelect = "";
  }, []);

  const snap = SNAPSHOTS[stepIndex];
  const prevSnap = stepIndex > 0 ? SNAPSHOTS[stepIndex - 1] : null;
  const changedVars = getChangedVars(snap, prevSnap);
  const newVars = getNewVars(snap, prevSnap);
  const allVars = snap.frames.flatMap((f) => f.vars);
  const activeArrayIndex = getActiveArrayIndex(allVars);
  const quickPrompts = QUICK_PROMPTS[snap.step] ?? ["이 단계 설명", "다음에 무슨 일이?"];

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= SNAPSHOTS.length - 1) {
      setIsPlaying(false);
      return;
    }
    const id = setTimeout(() => setStepIndex((p) => p + 1), speed);
    return () => clearTimeout(id);
  }, [isPlaying, stepIndex, speed]);

  // Scroll code to active line
  useEffect(() => {
    const el = codeRef.current?.querySelector("[data-active='true']") as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [stepIndex]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const goStep = (index: number) => {
    setIsPlaying(false);
    setStepIndex(Math.max(0, Math.min(SNAPSHOTS.length - 1, index)));
  };

  const togglePlay = () => {
    if (stepIndex >= SNAPSHOTS.length - 1) {
      setStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const handleSend = (msg?: string) => {
    const text = (msg ?? chatInput).trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { role: "user", content: text }]);
    setChatInput("");
    const response =
      AI_RESPONSES[text] ??
      "좋은 질문이에요! 현재 스냅샷의 스택과 힙 변화를 주의깊게 살펴보면 힌트를 찾을 수 있어요.";
    setTimeout(
      () => setChatMessages((prev) => [...prev, { role: "ai", content: response }]),
      380
    );
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-bg text-slate-50">
      {/* ─── Header ───────────────────────────────────── */}
      <header className="z-20 shrink-0 border-b border-white/10 bg-bg/95 backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Link
            href="/study"
            className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
          >
            ← 학습으로
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-white">
              Code
              <span className="bg-gradient-to-r from-blue to-purple bg-clip-text text-transparent">
                Flow
              </span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-sm font-semibold text-blue">JDI 실행 시각화</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-mono text-[11px] text-cyan">
              {snap.step} / {SNAPSHOTS.length}
            </span>
            <Link
              href="/study/records"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              기록 →
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 3-Panel Area ──────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── Left: Code Panel ───────────────────────── */}
        <aside
          ref={codeRef}
          className="hidden shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#111827] xl:flex"
          style={{ width: codePanelWidth }}
        >
          {/* Title bar */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-[#1f2937] px-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-400/80" />
              <span className="font-mono text-[12px] text-slate-400">Main.java</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Ln {snap.line}</span>
          </div>

          {/* Code lines */}
          <div className="flex-1 overflow-y-auto py-2 font-mono text-[13px]">
            {CODE_LINES.map((line, index) => {
              const lineNo = index + 1;
              const isActive = lineNo === snap.line;
              return (
                <div
                  key={lineNo}
                  data-active={isActive}
                  className={`flex items-start gap-2 px-2 py-[3px] transition-colors ${
                    isActive
                      ? "bg-blue/[0.12] shadow-[inset_2px_0_0_#3B82F6]"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="w-6 shrink-0 select-none pt-px text-right text-[11px] leading-5 text-slate-600">
                    {lineNo}
                  </span>
                  <span
                    className={`w-3 shrink-0 select-none pt-px text-[11px] leading-5 ${
                      isActive ? "text-blue" : "text-transparent"
                    }`}
                  >
                    ▶
                  </span>
                  <span
                    className={`whitespace-pre leading-5 ${
                      isActive ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {line}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Output display */}
          <div className="shrink-0 border-t border-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 bg-[#1f2937] px-4 py-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  snap.output ? "bg-emerald-400" : "bg-slate-600"
                }`}
              />
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">출력</span>
            </div>
            <div
              className={`min-h-[44px] px-4 py-2.5 font-mono text-sm ${
                snap.output ? "text-emerald-400" : "text-slate-600"
              }`}
            >
              {snap.output || "(출력 없음)"}
            </div>
          </div>
        </aside>

        {/* Code ↔ Center divider */}
        <div
          className="hidden touch-none select-none xl:flex"
          onPointerDown={startResize("code")}
          style={{ width: DIVIDER_W }}
        >
          <div className="flex w-full cursor-col-resize items-stretch justify-center bg-bg transition-colors hover:bg-white/[0.06]">
            <div className="my-3 w-px rounded-full bg-white/15" />
          </div>
        </div>

        {/* ── Center: Stack / Heap Visualization ──────── */}
        <section ref={centerRef} className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg">
          {/* Center header */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-[#111827] px-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                메모리 시각화
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-400">
                {snap.frames[0]?.label} · Line {snap.line}
              </span>
            </div>
            {snap.output && (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-400">
                출력: {snap.output}
              </span>
            )}
          </div>

          {/* Stack + Heap side by side */}
          <div className="flex min-h-0 flex-1 overflow-hidden">

            {/* ── Stack Memory ── */}
            <div
              className={`flex min-w-0 shrink-0 flex-col overflow-hidden border-r border-white/10 ${stackPanelWidth === 0 ? "flex-1" : ""}`}
              style={stackPanelWidth > 0 ? { width: stackPanelWidth } : undefined}
            >
              <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[#0d1117] px-4">
                <div className="h-1.5 w-1.5 rounded-full bg-blue" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue">
                  Stack Memory
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {snap.frames.map((frame, frameIdx) => (
                  <div
                    key={frameIdx}
                    className="overflow-hidden rounded-2xl border border-blue/25 bg-[#111827] shadow-[0_0_24px_rgba(59,130,246,0.06)]"
                  >
                    {/* Frame header */}
                    <div className="flex items-center justify-between bg-blue/[0.08] px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-blue" />
                        <span className="font-mono text-[12px] font-semibold text-blue">
                          {frame.label}
                        </span>
                      </div>
                      <span className="rounded-md bg-blue/20 px-2 py-0.5 font-mono text-[10px] text-blue/80">
                        :line {snap.line}
                      </span>
                    </div>

                    {/* Variables table */}
                    {frame.vars.length === 0 ? (
                      <p className="px-4 py-3 font-mono text-[12px] italic text-slate-600">
                        변수 없음
                      </p>
                    ) : (
                      <div>
                        {/* Column headers */}
                        <div className="grid grid-cols-3 border-b border-white/[0.06] px-4 py-1.5">
                          {["name", "type", "value"].map((h) => (
                            <span
                              key={h}
                              className="text-[10px] uppercase tracking-[0.2em] text-slate-600"
                            >
                              {h}
                            </span>
                          ))}
                        </div>

                        {/* Variable rows */}
                        <div className="divide-y divide-white/[0.04]">
                          {frame.vars.map((v) => {
                            const isChanged = changedVars.has(v.name);
                            const isNew = newVars.has(v.name);
                            const isRef = v.value.startsWith("→");

                            return (
                              <div
                                key={v.name}
                                className={`grid grid-cols-3 items-center px-4 py-2.5 transition-all duration-300 ${
                                  isNew
                                    ? "bg-emerald-500/[0.07]"
                                    : isChanged
                                      ? "bg-yellow-400/[0.07]"
                                      : "hover:bg-white/[0.02]"
                                }`}
                              >
                                <span
                                  className={`font-mono text-[13px] font-medium ${
                                    isNew
                                      ? "text-emerald-400"
                                      : isChanged
                                        ? "text-yellow-400"
                                        : "text-slate-200"
                                  }`}
                                >
                                  {v.name}
                                  {isChanged && !isNew && (
                                    <span className="ml-1 text-[9px] text-yellow-400/60">✦</span>
                                  )}
                                  {isNew && (
                                    <span className="ml-1 text-[9px] text-emerald-400/60">+</span>
                                  )}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {v.type}
                                </span>
                                <span
                                  className={`font-mono text-[13px] font-medium ${
                                    isRef
                                      ? "text-cyan"
                                      : isNew
                                        ? "text-emerald-400"
                                        : isChanged
                                          ? "text-yellow-400"
                                          : "text-slate-100"
                                  }`}
                                >
                                  {v.value}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-1 text-[10px]">
                  <span className="flex items-center gap-1.5 text-emerald-400/70">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500/30" />
                    새로 추가
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-400/70">
                    <span className="h-2 w-2 rounded-sm bg-yellow-400/30" />
                    값 변경
                  </span>
                  <span className="flex items-center gap-1.5 text-cyan">
                    <span className="h-2 w-2 rounded-sm bg-cyan/30" />
                    참조(ref)
                  </span>
                </div>

                {/* Step note */}
                <div className="rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5">
                  <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                    이번 단계
                  </p>
                  <p className="text-[12px] leading-5 text-slate-300">{snap.note}</p>
                </div>
              </div>
            </div>

            {/* Stack ↔ Heap divider */}
            <div
              className="touch-none select-none flex shrink-0"
              onPointerDown={startResize("stack")}
              style={{ width: DIVIDER_W }}
            >
              <div className="flex w-full cursor-col-resize items-stretch justify-center bg-bg transition-colors hover:bg-white/[0.06]">
                <div className="my-3 w-px rounded-full bg-white/15" />
              </div>
            </div>

            {/* ── Heap Memory ── */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[#0d1117] px-4">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan">
                  Heap Memory
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {snap.heap.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-2xl border border-white/10 text-sm text-slate-600">
                    힙에 객체 없음
                  </div>
                ) : (
                  snap.heap.map((h) => {
                    const values = h.rawValues.split(",").map((s) => s.trim());
                    const isArray =
                      h.typeLabel.includes("[") || h.typeLabel.endsWith("[]");

                    return (
                      <div
                        key={h.addr}
                        className="overflow-hidden rounded-2xl border border-cyan/20 bg-[#111827] shadow-[0_0_24px_rgba(6,182,212,0.05)]"
                      >
                        {/* Object header */}
                        <div className="flex items-center justify-between bg-cyan/[0.07] px-4 py-2.5">
                          <span className="font-mono text-[12px] font-semibold text-cyan">
                            {h.addr}
                          </span>
                          <span className="rounded-md bg-cyan/20 px-2 py-0.5 font-mono text-[10px] text-cyan/80">
                            {h.typeLabel}
                          </span>
                        </div>

                        {isArray ? (
                          <div className="px-4 py-4">
                            {/* Array visual cells */}
                            <div className="flex flex-wrap gap-2">
                              {values.map((val, idx) => {
                                const isCurrent = activeArrayIndex === idx;
                                const isMax =
                                  allVars.find((v) => v.name === "max")?.value === val;
                                return (
                                  <div key={idx} className="flex flex-col items-center gap-1.5">
                                    <div
                                      className={`flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-[15px] font-bold transition-all duration-300 ${
                                        isCurrent
                                          ? "border-cyan/60 bg-cyan/20 text-cyan shadow-[0_0_16px_rgba(6,182,212,0.3)]"
                                          : isMax
                                            ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-400"
                                            : "border-white/15 bg-[#1f2937] text-slate-200"
                                      }`}
                                    >
                                      {val}
                                    </div>
                                    <span
                                      className={`text-[10px] font-mono ${
                                        isCurrent ? "text-cyan" : "text-slate-600"
                                      }`}
                                    >
                                      [{idx}]
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Active index indicator */}
                            {activeArrayIndex !== null && (
                              <div className="mt-3 flex items-center gap-2 rounded-lg border border-cyan/15 bg-cyan/[0.06] px-3 py-1.5 text-[11px]">
                                <span className="font-mono text-cyan">i = {activeArrayIndex}</span>
                                <span className="text-slate-500">→</span>
                                <span className="font-mono text-slate-300">
                                  arr[{activeArrayIndex}] ={" "}
                                  <span className="text-cyan">
                                    {values[activeArrayIndex] ?? "?"}
                                  </span>
                                </span>
                              </div>
                            )}

                            {/* Max indicator */}
                            {allVars.find((v) => v.name === "max") && (
                              <div className="mt-2 flex items-center gap-2 rounded-lg border border-yellow-400/15 bg-yellow-400/[0.05] px-3 py-1.5 text-[11px]">
                                <span className="text-slate-500">현재 최댓값</span>
                                <span className="font-mono font-bold text-yellow-400">
                                  max = {allVars.find((v) => v.name === "max")?.value}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="px-4 py-3 font-mono text-sm text-slate-200">
                            {h.rawValues}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Reference diagram */}
                {snap.heap.length > 0 && allVars.some((v) => v.value.startsWith("→")) && (
                  <div className="rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2.5">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                      참조 관계
                    </p>
                    {allVars
                      .filter((v) => v.value.startsWith("→"))
                      .map((v) => (
                        <div key={v.name} className="flex items-center gap-2 text-[11px]">
                          <span className="font-mono text-blue">{v.name}</span>
                          <span className="text-slate-600">──▶</span>
                          <span className="font-mono text-cyan">{v.value.replace("→ ", "")}</span>
                          <span className="text-slate-500">
                            (
                            {snap.heap.find((h) => h.addr === v.value.replace("→ ", ""))
                              ?.typeLabel ?? ""}
                            )
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis bar */}
          <div className="shrink-0 border-t border-white/10 bg-[#111827] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue/20 text-[10px] font-bold text-blue">
                AI
              </div>
              <p className="text-[13px] leading-6 text-slate-300">{snap.ai}</p>
            </div>
          </div>
        </section>

        {/* Center ↔ AI divider */}
        <div
          className="hidden touch-none select-none xl:flex"
          onPointerDown={startResize("ai")}
          style={{ width: DIVIDER_W }}
        >
          <div className="flex w-full cursor-col-resize items-stretch justify-center bg-bg transition-colors hover:bg-white/[0.06]">
            <div className="my-3 w-px rounded-full bg-white/15" />
          </div>
        </div>

        {/* ── Right: AI Tutor ──────────────────────────── */}
        <aside
          className="hidden shrink-0 flex-col overflow-hidden border-l border-white/10 bg-bg/80 xl:flex"
          style={{ width: aiPanelWidth }}
        >
          {/* Title bar */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-[#1f2937] px-4">
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500">AI 튜터</span>
            <span className="text-[11px] text-emerald-400">● Gemini</span>
          </div>

          {/* Snapshot context badge */}
          <div className="shrink-0 border-b border-white/[0.07] px-4 py-2">
            <span className="rounded-lg border border-blue/20 bg-blue/[0.07] px-2.5 py-1 text-[11px] text-blue/80">
              스냅샷 {snap.step}: {snap.frames[0]?.label} · Line {snap.line}
            </span>
          </div>

          {/* Chat messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    msg.role === "ai"
                      ? "bg-blue/20 text-blue"
                      : "bg-purple/20 text-purple-300"
                  }`}
                >
                  {msg.role === "ai" ? "AI" : "나"}
                </div>
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    msg.role === "ai"
                      ? "rounded-bl-md bg-[#1f2937] text-slate-100"
                      : "rounded-br-md border border-blue/20 bg-blue/10 text-slate-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="shrink-0 px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-slate-400 transition hover:border-blue/35 hover:text-blue"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-white/10 p-4">
            <div className="flex gap-2">
              <textarea
                rows={1}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="현재 스냅샷에 대해 질문하세요..."
                className="min-h-[42px] flex-1 resize-none rounded-xl border border-white/15 bg-[#1f2937] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue/40"
              />
              <button
                onClick={() => handleSend()}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-blue text-sm font-semibold text-white transition hover:opacity-90"
              >
                ↑
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Bottom Controls ──────────────────────────── */}
      <footer className="shrink-0 border-t border-white/10 bg-[#111827] px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Step dots / timeline */}
          <div className="flex items-center gap-1.5">
            {SNAPSHOTS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => goStep(idx)}
                title={`Step ${s.step}: Line ${s.line}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === stepIndex
                    ? "w-7 bg-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    : idx < stepIndex
                      ? "w-2 bg-blue/40 hover:bg-blue/60"
                      : "w-2 bg-white/20 hover:bg-white/35"
                }`}
              />
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Playback buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goStep(0)}
              disabled={stepIndex === 0}
              title="처음으로"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-sm text-slate-400 transition hover:border-blue/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              ◄◄
            </button>
            <button
              onClick={() => goStep(stepIndex - 1)}
              disabled={stepIndex === 0}
              title="이전 단계"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-sm text-slate-400 transition hover:border-blue/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              ◄
            </button>
            <button
              onClick={togglePlay}
              title={isPlaying ? "일시정지" : "재생"}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold text-white transition ${
                isPlaying
                  ? "bg-yellow-500/80 hover:bg-yellow-500"
                  : "bg-gradient-to-r from-blue to-purple hover:opacity-90"
              }`}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => goStep(stepIndex + 1)}
              disabled={stepIndex === SNAPSHOTS.length - 1}
              title="다음 단계"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-sm text-slate-400 transition hover:border-blue/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              ►
            </button>
            <button
              onClick={() => goStep(SNAPSHOTS.length - 1)}
              disabled={stepIndex === SNAPSHOTS.length - 1}
              title="마지막으로"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-sm text-slate-400 transition hover:border-blue/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              ►►
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Speed control */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-[11px] text-slate-500">속도</span>
            <input
              type="range"
              min={400}
              max={2400}
              step={200}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-white/15 accent-blue"
            />
            <span className="w-8 text-right font-mono text-[11px] text-slate-400">
              {(speed / 1000).toFixed(1)}s
            </span>
          </div>

          {/* Step display */}
          <div className="rounded-lg border border-white/10 bg-bg px-3 py-1.5 text-center">
            <span className="font-mono text-[12px] text-slate-300">
              {stepIndex + 1}{" "}
              <span className="text-slate-600">/</span>{" "}
              {SNAPSHOTS.length}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
