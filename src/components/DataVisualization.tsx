import React from "react";
import { Highlight, KeyFact } from "../types";
import { TrendingUp, BarChart3, ListCollapse, Compass } from "lucide-react";

interface VisualsProps {
  highlights: Highlight[];
  facts: KeyFact[];
}

export default function DataVisualization({ highlights = [], facts = [] }: VisualsProps) {
  // Filter facts that possess interesting metric markers
  const metricFacts = facts.filter((f) => f.metric && f.metric.trim() !== "");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      {/* Visual Chart: Highlights Multi-Bar Indicator */}
      {highlights.length > 0 && (
        <div id="visual-highlights-container" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Strategic Impact Ratings
            </h4>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/60">Intensity Score %</span>
          </div>

          <div className="space-y-4">
            {highlights.map((h, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-850 group-hover:text-emerald-600 transition-colors uppercase text-[10.5px] tracking-wide">
                      {h.title}
                    </span>
                  </div>
                  <span className="font-mono text-emerald-600 font-bold">{h.score}%</span>
                </div>
                {/* Custom SVG Bar Chart */}
                <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 transition-all duration-1000 ease-out"
                    style={{ width: `${h.score}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 pl-3.5">
                  <span className="italic truncate max-w-[70%] text-slate-500">{h.description}</span>
                  <span className="bg-emerald-50 text-emerald-700 font-mono text-[9px] font-semibold px-2 py-0.5 rounded border border-emerald-150">
                    {h.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Chart: Statistical Key Metrics Board */}
      <div id="visual-metrics-container" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Quantified Empirical Findings
          </h4>

          {metricFacts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {metricFacts.slice(0, 4).map((f, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between transition-all duration-300 hover:border-indigo-400/40 hover:bg-slate-100/60 group"
                >
                  <div className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-emerald-650 font-mono tracking-tight group-hover:scale-102 transition-transform origin-left">
                    {f.metric}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold mb-1 truncate leading-relaxed">
                    {f.fact.length > 30 ? f.fact.substring(0, 30) + "..." : f.fact}
                  </div>
                  <p className="text-[10px] text-slate-650 leading-normal line-clamp-2">
                    {f.context}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Compass className="w-8 h-8 text-slate-400 mb-2 animate-spin-slow" />
              <p className="text-xs">Strategic indicators compile automatically from section fact finding.</p>
            </div>
          )}
        </div>

        {/* Fact Summary mini widget */}
        {facts.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-sans">
              <ListCollapse className="w-3.5 h-3.5 text-indigo-500" />
              Consolidated Facts Extracted
            </span>
            <span className="font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-150 font-bold">
              {facts.length} items
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

