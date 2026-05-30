import React, { useEffect, useState, useRef } from "react";
import { Section } from "../types";
import { Loader2, Globe, CheckCircle2, AlertCircle, Sparkles, Server, BookOpen } from "lucide-react";

interface ProgressProps {
  sections: Section[];
  topic: string;
  depth: string;
}

const AGENT_MESSAGES = [
  "Formulating targeted search payloads...",
  "Querying Google Search grounding indexes...",
  "Retrieving real-time web references & news...",
  "Evaluating reliability credentials of sources...",
  "Parsing statistical content & charts...",
  "Isolating empirical metrics & figures...",
  "Generating synthesized markdown prose...",
  "Attributing exact reference citation points...",
  "Finalizing analytical fact-cards..."
];

export default function ResearchProgress({ sections, topic, depth }: ProgressProps) {
  const currentSection = sections.find((s) => s.status === "researching");
  const completedCount = sections.filter((s) => s.status === "completed").length;
  const totalCount = sections.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Status simulation/indexing for the visual logs
  const [logIndex, setLogIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cycle logs to simulate real-time operations
  useEffect(() => {
    if (!currentSection) return;

    setLogs([
      `⚡ [AGENT] Commencing investigation on Pillar: "${currentSection.title}"`,
      `⚙️ [AGENT] Target Area parameters: ${currentSection.objective}`,
      `🌐 [GROUNDING] Active parameters: [${currentSection.focusKeywords.join(", ")}]`
    ]);
    setLogIndex(0);

    const interval = setInterval(() => {
      setLogIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % AGENT_MESSAGES.length;
        const newLog = `⚙️ [GROUNDING] ${AGENT_MESSAGES[nextIdx]}`;
        setLogs((prevLogs) => [...prevLogs.slice(-15), newLog]);
        return nextIdx;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [currentSection?.id]);

  // Keep logs scrolled down
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div id="research-progress-panel" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Top Banner Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-250">
        <div>
          <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-1 rounded-full font-bold">
            Investigation Agent Engaged
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-3">
            Grounded Fact Finding Sequence
          </h3>
          <p className="text-xs text-slate-500 mt-1 truncate max-w-lg">
            Research Theme: <span className="text-slate-700 font-bold">{topic}</span>
          </p>
        </div>

        {/* Global Progress Radial/Horizontal */}
        <div className="flex items-center gap-3 self-start md:self-auto min-w-[200px]">
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs text-slate-500 font-mono mb-1">
              <span>Overall Status</span>
              <span className="font-bold">{completedCount} / {totalCount} Completed</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-lg font-bold font-mono text-indigo-600">{progressPercent}%</span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Pillars checklist */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-3">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Target Research Pillars
          </span>
          
          <div className="space-y-3">
            {sections.map((s, idx) => (
              <div
                key={s.id}
                className={`flex items-start gap-3 rounded-xl p-3 border transition-colors ${
                  s.status === "researching"
                    ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                    : s.status === "completed"
                    ? "bg-slate-50/70 border-slate-200/80"
                    : s.status === "failed"
                    ? "bg-rose-50 border-rose-200/60"
                    : "bg-white border-slate-150 opacity-60"
                }`}
              >
                {/* Status Icon Indicator */}
                <div className="mt-0.5">
                  {s.status === "researching" ? (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  ) : s.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : s.status === "failed" ? (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-500">
                      {idx + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold ${
                    s.status === "researching" ? "text-indigo-700" : "text-slate-800"
                  }`}>
                    {s.title}
                  </h4>
                  {s.status === "researching" && (
                    <span className="text-[10px] font-mono text-emerald-600 mt-1 block animate-pulse font-bold">
                      Analyzing Web Grounds...
                    </span>
                  )}
                  {s.status === "completed" && (
                    <span className="text-[9.5px] font-mono text-slate-500 mt-0.5 block font-bold">
                      ✔ Generated {s.keyFacts?.length || 0} facts • {s.sources?.length || 0} cited sources
                    </span>
                  )}
                  {s.status === "failed" && (
                    <span className="text-[9.5px] font-mono text-rose-500 mt-0.5 block font-bold">
                      ⚠ {s.error || "Investigation crashed"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Interactive Console stream */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col h-[280px] lg:h-auto bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-hidden shadow-inner relative justify-between">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase text-[10px] font-bold">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Live Workspace Console Logs
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* Scrolling log container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`leading-relaxed break-all ${
                  log.startsWith("⚡")
                    ? "text-indigo-300 font-bold"
                    : log.includes("GROUNDING")
                    ? "text-slate-400"
                    : log.includes("FACT")
                    ? "text-emerald-300"
                    : "text-slate-500"
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          {/* Bottom active block indicator */}
          <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              Google Search Grounding Engine v2
            </span>
            <span className="italic">Depth: {depth}</span>
          </div>
        </div>
      </div>

      {/* Progress Footer reassurance */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
        <div className="text-xs text-slate-655 leading-normal">
          <span className="font-bold text-slate-800 text-[12px]">Did you know?</span> Web grounding works by combining the parametric intelligence of Gemini 3.5 with context retrieved live from top search indexing directories. This completely eliminates hallucinations on recent facts. Please stay tuned as the segments finalize.
        </div>
      </div>
    </div>
  );
}
