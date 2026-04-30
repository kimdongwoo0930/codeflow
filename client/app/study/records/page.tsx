import Link from "next/link";

const records = [
  {
    title: "배열 최댓값 찾기",
    status: "통과",
    statusClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    time: "2026-04-25 14:21",
    note: "정답",
  },
  {
    title: "배열 최댓값 찾기",
    status: "재도전",
    statusClass: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
    time: "2026-04-25 14:12",
    note: "조건문 누락",
  },
  {
    title: "반복문 기초",
    status: "통과",
    statusClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    time: "2026-04-25 13:58",
    note: "빠르게 해결",
  },
];

export default function RecordsPage() {
  return (
    <main className="min-h-screen bg-[#0b0f1a] text-slate-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/study" className="text-sm text-slate-400 transition hover:text-white">
            ← 학습으로
          </Link>
          <span className="text-sm font-semibold tracking-wide text-blue">CodeFlow · 제출 기록</span>
          <Link href="/study/visualization" className="text-sm text-slate-400 transition hover:text-white">
            시각화 →
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">선택 기능</p>
          <h1 className="mt-2 text-2xl font-bold text-white">제출한 기록을 모아보는 화면</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            이 페이지도 필수는 아니에요. 제출 후 언제든 돌아와서, 어떤 문제를 통과했고 어떤 문제를 다시 풀어야 하는지 확인하는 용도로 보면 됩니다.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#111827] p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <p className="text-sm font-semibold text-white">이번 세션 요약</p>
              <span className="rounded-full border border-blue/25 bg-blue/10 px-2.5 py-1 text-[11px] text-blue">
                3개 기록
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-300">통과</p>
                <p className="mt-2 text-2xl font-bold text-white">2</p>
              </div>
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-xs text-yellow-300">재도전</p>
                <p className="mt-2 text-2xl font-bold text-white">1</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="text-xs text-cyan-300">학습 시간</p>
                <p className="mt-2 text-2xl font-bold text-white">18m</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">기록 목록</p>
              <h2 className="mt-2 text-xl font-bold text-white">최근 제출 기록</h2>
            </div>
            <Link href="/study" className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-blue/40 hover:text-white">
              다시 풀기
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {records.map((record) => (
              <article key={`${record.title}-${record.time}`} className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{record.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{record.time} · {record.note}</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${record.statusClass}`}>
                    {record.status}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm leading-7 text-slate-300">
            제출 기록은 결과를 되돌아보는 용도이고, 여기서 다시 풀기 버튼으로 바로 학습 화면으로 돌아갈 수 있습니다.
          </div>
        </section>
      </div>
    </main>
  );
}
