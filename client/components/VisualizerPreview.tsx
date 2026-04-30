const previewMessages = [
  {
    role: "ai",
    content: "첫 번째 원소를 기준값으로 두고, 더 큰 값을 만나면 max를 갱신해보세요.",
  },
  {
    role: "user",
    content: "for문 안에서는 arr[i]랑 max만 비교하면 되나요?",
  },
  {
    role: "ai",
    content: "맞아요. 현재 값이 더 클 때만 max를 바꾸면 됩니다.",
  },
] as const;

const previewTemplates = ["배열 최댓값", "선형 탐색", "버블 정렬"] as const;

const previewCode = [
  "public class Main {",
  "  public static void main(String[] args) {",
  "    int[] arr = {3, 9, 1, 7};",
  "    int max = arr[0];",
  "",
  "    for (int i = 1; i < arr.length; i++) {",
  "      if (arr[i] > max) max = arr[i];",
  "    }",
  "",
  "    System.out.println(max);",
  "  }",
  "}",
] as const;

export function VisualizerPreview() {
  return (
    <div
      id="visualizer"
      className="panel-border w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0f1a]/90 shadow-[0_30px_80px_rgba(2,8,23,0.45)] transition-transform duration-500 hover:-translate-y-1"
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b0f1a]/95 px-5 py-4">
        <div className="flex items-center gap-5">
          <div className="font-mono text-sm font-bold tracking-tight text-white">
            Code<span className="bg-gradient-to-r from-blue to-purple bg-clip-text text-transparent">Flow</span>
          </div>
          <div className="hidden items-center gap-1 md:flex">
            {["문제 풀기", "시각화", "제출 기록"].map((tab, index) => (
              <span
                key={tab}
                className={`rounded-md border px-3 py-1 text-[11px] ${index === 0 ? "border-blue/30 bg-blue/10 text-blue" : "border-transparent text-slate-500"}`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-blue/30 bg-blue/10 px-3 py-1 font-mono text-[11px] text-blue">
            EASY
          </span>
          <span className="rounded-md bg-gradient-to-r from-blue to-indigo-500 px-3 py-1.5 text-[11px] font-semibold text-white">
            ▶ 제출 및 채점
          </span>
        </div>
      </div>

      <div className="grid min-h-[420px] grid-cols-1 bg-white/5 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <aside className="border-r border-white/10 bg-[#0b0f1a]/70">
          <div className="flex h-11 items-center border-b border-white/10 bg-[#1f2937] px-4">
            <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">문제</span>
          </div>
          <div className="space-y-5 p-4">
            <div>
              <h3 className="text-lg font-semibold text-white">배열 최댓값 찾기</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                  EASY
                </span>
                <span className="rounded-full border border-blue/30 bg-blue/10 px-2.5 py-1 text-[11px] text-blue">배열</span>
                <span className="rounded-full border border-blue/30 bg-blue/10 px-2.5 py-1 text-[11px] text-blue">반복문</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                배열에서 가장 큰 값을 출력하세요.
                <br />
                내장 함수 없이 반복문으로 직접 구현합니다.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">입력 / 출력 예시</p>
              <div className="space-y-2">
                <div className="rounded-xl bg-[#1f2937] p-3 font-mono text-xs text-slate-300">
                  <p className="mb-1 text-[10px] text-slate-500">입력</p>
                  <p className="text-cyan-400">int[] arr = {"{3, 9, 1, 7}"};</p>
                </div>
                <div className="rounded-xl bg-[#1f2937] p-3 font-mono text-xs text-slate-300">
                  <p className="mb-1 text-[10px] text-slate-500">출력</p>
                  <p className="text-cyan-400">9</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-l-4 border-yellow-400 bg-[#1f2937] px-4 py-3 text-sm leading-6 text-slate-300">
              첫 번째 원소를 최댓값으로 두고 비교를 시작하세요.
            </div>
          </div>
        </aside>

        <section className="border-r border-white/10 bg-[#111827]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-orange-400/35 bg-orange-400/10 px-2.5 py-1 font-mono text-[11px] text-orange-300">
                Java
              </span>
              <span className="font-mono text-xs text-slate-500">Main.java</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
                ▷ 실행
              </span>
              <span className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-slate-400">
                ↺ 초기화
              </span>
            </div>
          </div>

          <div className="border-b border-white/10 px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {previewTemplates.map((template, index) => (
                <span
                  key={template}
                  className={`rounded-full border px-3 py-1 text-[11px] ${index === 0 ? "border-blue/40 bg-blue/10 text-blue" : "border-white/10 text-slate-500"}`}
                >
                  {template}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] px-4 py-4 font-mono text-[13px] leading-7 text-slate-200">
            {previewCode.map((line, index) => {
              const active = index === 6;
              return (
                <div
                  key={`${index}-${line}`}
                  className={`flex items-start gap-3 rounded-md px-3 py-0.5 ${active ? "bg-blue/10 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.14)]" : ""}`}
                >
                  <span className="w-5 pt-0.5 text-right text-[11px] text-slate-500">{index + 1}</span>
                  <span className={`w-3 pt-0.5 text-[11px] ${active ? "text-blue" : "text-transparent"}`}>▶</span>
                  <span className="whitespace-pre text-slate-200">{line}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 bg-[#1f2937] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span>실행 완료</span>
            </div>
            <div className="min-h-[84px] px-4 py-3 font-mono text-sm text-emerald-400">9</div>
          </div>
        </section>

        <aside className="flex flex-col bg-[#0b0f1a]/80">
          <div className="flex h-11 items-center justify-between border-b border-white/10 bg-[#1f2937] px-4">
            <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">AI 튜터</span>
            <span className="text-[11px] text-emerald-400">● Gemini</span>
          </div>

          <div className="flex-1 space-y-3 px-4 py-4">
            {previewMessages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${message.role === "ai" ? "bg-blue/20 text-blue" : "bg-purple/20 text-purple-300"}`}>
                  {message.role === "ai" ? "AI" : "나"}
                </div>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-6 ${message.role === "ai" ? "rounded-bl-md bg-[#1f2937] text-slate-100" : "rounded-br-md border border-blue/20 bg-blue/10 text-slate-100"}`}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {["어떻게 시작해요?", "조건문 힌트", "시간복잡도?"].map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-slate-400"
                >
                  {prompt}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="min-h-[42px] flex-1 rounded-xl border border-white/15 bg-[#1f2937] px-3 py-2 text-sm text-slate-500">
                코드 작성 중 막히면 물어보세요...
              </div>
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-blue text-sm font-semibold text-white">
                ↑
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 font-mono text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>Main.java</span>
          <span>·</span>
          <span>234 chars</span>
        </div>
        <span>CodeFlow · Java</span>
      </div>
    </div>
  );
}
