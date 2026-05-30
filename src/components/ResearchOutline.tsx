import React, { useState } from "react";
import { ResearchPlan, Section } from "../types";
import { Trash2, Plus, Edit3, ArrowRight, Play, RefreshCw, FileText, ChevronRight } from "lucide-react";

interface OutlineProps {
  plan: ResearchPlan;
  onUpdatePlan: (updatedPlan: ResearchPlan) => void;
  onLaunchResearch: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export default function ResearchOutline({
  plan,
  onUpdatePlan,
  onLaunchResearch,
  onReset,
  isLoading
}: OutlineProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [tempObjective, setTempObjective] = useState("");
  const [tempKeywords, setTempKeywords] = useState("");

  const handleRemoveSection = (id: string) => {
    const updatedSections = plan.sections.filter((s) => s.id !== id);
    onUpdatePlan({ ...plan, sections: updatedSections });
  };

  const handleAddSection = () => {
    const newSection: Section = {
      id: `custom-slug-${Date.now()}`,
      title: "New Investigation Section",
      objective: "Specific questions, details or parameters to verify on this dimension.",
      focusKeywords: ["specification", "industry", "timeline"],
      status: "idle"
    };
    onUpdatePlan({ ...plan, sections: [...plan.sections, newSection] });
  };

  const startEditing = (s: Section) => {
    setEditingSectionId(s.id);
    setTempTitle(s.title);
    setTempObjective(s.objective);
    setTempKeywords(s.focusKeywords.join(", "));
  };

  const saveEditing = (sId: string) => {
    const updatedSections = plan.sections.map((s) => {
      if (s.id === sId) {
        return {
          ...s,
          title: tempTitle.trim() || s.title,
          objective: tempObjective.trim() || s.objective,
          focusKeywords: tempKeywords
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k !== "")
        };
      }
      return s;
    });
    onUpdatePlan({ ...plan, sections: updatedSections });
    setEditingSectionId(null);
  };

  return (
    <div id="research-outline-card" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm transition-all duration-300">
      {/* Title & Scope header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
        <div className="flex-1">
          <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-150">
            Phase 1 Outline Formulated
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 tracking-tight mt-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            {plan.title}
          </h3>
          <p className="text-xs text-slate-600 mt-2 italic font-sans border-l-2 border-indigo-550/45 pl-3 leading-relaxed">
            {plan.scope}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-550 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Restart Request
          </button>
        </div>
      </div>

      {/* Sections breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Target Investigation Pillars ({plan.sections.length})</span>
          <span className="text-[10px] text-slate-500">Edit outlined pillars below</span>
        </div>

        {plan.sections.map((s, index) => (
          <div
            key={s.id}
            className={`transition-all rounded-xl p-4 border ${
              editingSectionId === s.id
                ? "bg-slate-50 border-indigo-400 shadow-sm"
                : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-350 shadow-sm"
            }`}
          >
            {editingSectionId === s.id ? (
              // EDIT MODE
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-bold mb-1">
                    Pillar Name
                  </label>
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-bold mb-1">
                    Grounded Search Objective / Prompts
                  </label>
                  <textarea
                    rows={2}
                    value={tempObjective}
                    onChange={(e) => setTempObjective(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-slate-400 font-bold mb-1">
                    Focus Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tempKeywords}
                    onChange={(e) => setTempKeywords(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => saveEditing(s.id)}
                    className="text-[10px] uppercase tracking-wider font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Apply Structure
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSectionId(null)}
                    className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            ) : (
              // DISPLAY MODE
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-[10px] font-mono select-none">
                      {index + 1}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-800">
                      {s.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 pl-7 leading-relaxed font-sans">
                    {s.objective}
                  </p>
                  
                  {/* Keywords list */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-7">
                    {s.focusKeywords.map((k, kIdx) => (
                      <span
                        key={kIdx}
                        className="text-[9px] font-mono bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-medium"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-center">
                  <button
                    type="button"
                    onClick={() => startEditing(s)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-650 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit content guidelines"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {plan.sections.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Omit this pillar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Append a section trigger */}
        <button
          type="button"
          onClick={handleAddSection}
          className="w-full border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl py-3 text-xs font-bold text-slate-455 hover:text-indigo-650 transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50"
        >
          <Plus className="w-3.5 h-3.5" />
          Append Custom Section Dimension
        </button>
      </div>

      {/* Start Research Engine trigger */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-[11px] text-slate-500 leading-relaxed max-w-md">
          Once initiated, the Research Agent executes deep web operations to extract qualitative summaries, key facts, data columns, and direct URLs for citations.
        </div>

        <button
          type="button"
          onClick={onLaunchResearch}
          disabled={isLoading || plan.sections.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-end sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-current text-indigo-200" />
          Launch Grounded Web Analysis
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
