import { Navbar } from "@/components/Navbar";
import { StageProblemList } from "@/components/StageProblemList";

export default function StagesPage() {
  return (
    <main className="min-h-screen bg-bg text-slate-50">
      <Navbar />
      <StageProblemList />
    </main>
  );
}
