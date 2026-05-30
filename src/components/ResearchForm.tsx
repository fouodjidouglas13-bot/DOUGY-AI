import React, { useState } from "react";
import { Sparkles, HelpCircle, ArrowRight, Zap, GraduationCap, LineChart } from "lucide-react";

interface FormProps {
  onStartResearch: (config: {
    topic: string;
    focusAreas: string;
    tone: string;
    depth: string;
  }) => void;
  isLoading: boolean;
}

const PRESETS = [
  {
    title: "Solid-state electrolyte battery breakthroughs 2025-2026",
    category: "Technology",
    icon: Zap,
    focus: "Chemical foundations, raw materials, energy densities, active scale-up efforts"
  },
  {
    title: "Global microplastic levels in dietary water systems",
    category: "Scientific",
    icon: GraduationCap,
    focus: "Toxicity metrics, ingestion loads, water filtration pathways, legislative measures"
  },
  {
    title: "Venture capital cycles in commercial space systems",
    category: "Economic",
    icon: LineChart,
    focus: "Launch costs, asteroid mining specs, defense satellite orders, private sector funding"
  }
];

export default function ResearchForm({ onStartResearch, isLoading }: FormProps) {
  const [topic, setTopic] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [tone, setTone] = useState("Professional Business Analyst");
  const [depth, setDepth] = useState("Comprehensive");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStartResearch({ topic, focusAreas, tone, depth });
  };

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setTopic(p.title);
    setFocusAreas(p.focus);
    setSuggestError(null);
  };

  const handleSuggestFocus = async () => {
    if (!topic.trim()) return;
    setIsSuggesting(true);
    setSuggestError(null);
    try {
      const res = await fetch("/api/ai/suggest-focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() })
      });
      if (!res.ok) throw new Error("Could not fetch parameter recommendations.");
      const data = await res.ok ? await res.json() : null;
      if (data && data.suggestedFocus) {
        setFocusAreas(data.suggestedFocus);
      }
    } catch (err: any) {
      console.error(err);
      setSuggestError(err?.message || "Error analyzing topic parameters.");
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div id="research-form-card" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300">
      <div className="mb-6">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Configure AI Research Agent
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Provide a specialized research subject and let Gemini search the web, audit findings, and synthesize detailed, cited chapters automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Input */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Research Theme or Core Inquiry <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="research-topic-input"
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Comparative analysis of sodium-ion vs lithium-sulfur battery potentials, key players, and commercial roadmap in next decade..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500/80 focus:bg-white rounded-xl p-3.5 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all resize-none font-sans leading-relaxed"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Suggestion Presets */}
        <div className="space-y-2">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Inspiration Presets
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESETS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  disabled={isLoading}
                  className="flex flex-col items-start text-left bg-slate-50 hover:bg-slate-100/70 border border-slate-205 hover:border-slate-300 rounded-xl p-3 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">{p.category}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed group-hover:text-slate-900 transition-colors">
                    {p.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            Focus Parameters / Scope Constraints
            <span className="group relative">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-[10px] text-slate-250 rounded border border-slate-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-all leading-normal z-50 shadow-xl">
                Keywords, specific dimensions, limits, or sub-questions to guide search grounding.
              </span>
            </span>
          </label>
          <input
            id="research-focus-input"
            type="text"
            value={focusAreas}
            onChange={(e) => setFocusAreas(e.target.value)}
            placeholder="e.g., raw chemistry, commercial barriers, safety, main active labs"
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500/80 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all font-sans"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <button
              type="button"
              onClick={handleSuggestFocus}
              disabled={isLoading || isSuggesting || !topic.trim()}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isSuggesting ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin inline-block" />
                  Brainstorming Parameters...
                </>
              ) : (
                <>✨ Brainstorm Scope with AI</>
              )}
            </button>
            {suggestError && (
              <span className="text-[10px] text-rose-600 font-medium">{suggestError}</span>
            )}
          </div>
        </div>

        {/* Dual Column for Tone and Depth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Output Writing Tone */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Writing Perspective & Tone
            </label>
            <select
              id="research-tone-select"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-all cursor-pointer"
              disabled={isLoading}
            >
              <option value="Professional Business Analyst">Professional Analyst / Strategic Insight</option>
              <option value="Rigorous Stanford Researcher">Academic / Rigorous Researcher</option>
              <option value="Exploratory Investigative Journalist">Investigative / Journalist Analysis</option>
              <option value="Scientific Educator Simple Prose">Plain English / Simplified Digest</option>
            </select>
          </div>

          {/* Depth Model */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Project Depth Specification
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
              {["Standard", "Comprehensive", "Deep Dive"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDepth(opt)}
                  disabled={isLoading}
                  className={`py-1.5 px-2 text-xs rounded-lg transition-all ${
                    depth === opt
                      ? "bg-white text-indigo-600 shadow-sm font-bold border border-slate-200/50"
                      : "text-slate-550 hover:text-slate-800 font-medium"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          id="research-submit-btn"
          disabled={isLoading || !topic.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
              Formulating Core Research Plan...
            </>
          ) : (
            <>
              Generate Structural Outline
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
