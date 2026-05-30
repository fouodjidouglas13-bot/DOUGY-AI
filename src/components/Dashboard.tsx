import React, { useState } from "react";
import { ResearchProject } from "../types";
import TrendAnalysis from "./TrendAnalysis";
import {
  History,
  FileText,
  BadgeAlert,
  Search,
  BookOpen,
  Calendar,
  Grid,
  ChevronRight,
  TrendingUp,
  Globe2,
  ListRestart
} from "lucide-react";

interface DashboardProps {
  projects: ResearchProject[];
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onNewRequest: () => void;
}

export default function Dashboard({
  projects = [],
  onSelectProject,
  onDeleteProject,
  onNewRequest
}: DashboardProps) {
  const [searchText, setSearchText] = useState("");

  // Aggregate Metrics
  const totalReports = projects.filter((p) => p.status === "completed").length;
  const totalPillers = projects.reduce((acc, p) => acc + p.sections.length, 0);
  
  // Count unique cited references across all reports
  const uniqueUrls = new Set<string>();
  projects.forEach((p) => {
    p.sections.forEach((s) => {
      (s.sources || []).forEach((src) => {
        if (src.url && src.url !== "#") {
          uniqueUrls.add(src.url);
        }
      });
    });
  });
  const totalSharedSources = uniqueUrls.size;

  // Filter projects by title or topic based on search input
  const filteredProjects = projects.filter((p) => {
    const titleVal = (p.title || "").toLowerCase();
    const topicVal = (p.topic || "").toLowerCase();
    const scopeVal = (p.scope || "").toLowerCase();
    const searchVal = searchText.toLowerCase();
    return titleVal.includes(searchVal) || topicVal.includes(searchVal) || scopeVal.includes(searchVal);
  });

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Research Reports
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono leading-none">
              {totalReports}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5 leading-none">
              Completed
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Pillars investigated
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono leading-none">
              {totalPillers}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5 leading-none">
              Strategic chapters
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-655 shrink-0 border border-amber-100">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Cited References
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono leading-none">
              {totalSharedSources}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5 leading-none">
              Unique URL sources
            </span>
          </div>
        </div>
      </div>

      {/* Trend Analysis Graph */}
      <TrendAnalysis projects={projects} />

      {/* Main Split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Historical reports list */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Historical Search Archives
            </h3>
            
            <button
              onClick={onNewRequest}
              className="text-xs text-indigo-700 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors bg-indigo-50 border border-indigo-150 px-2.5 py-1 rounded-lg"
            >
              New Research Agent
            </button>
          </div>

          {/* Historical search archive query filter input */}
          {projects.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search historical archives by title or topic..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 transition-all font-medium"
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-450 hover:text-slate-750 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {projects.length > 0 ? (
            filteredProjects.length > 0 ? (
              <div className="space-y-3">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className="bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 hover:border-slate-350 rounded-xl p-4 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-mono font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded leading-none">
                          {p.depth}
                        </span>
                        <span className="text-[10px] text-slate-450 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 mt-1.5 truncate group-hover:text-indigo-600 transition-colors">
                        {p.title || p.topic}
                      </h4>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic max-w-xl">
                        {p.scope || "No scope described."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => onDeleteProject(p.id, e)}
                        className="text-[10px] font-bold text-slate-450 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
                        title="Erase compiled records"
                      >
                        Delete
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-705">No matches found</p>
                <p className="text-[11px] text-slate-500">Your current search query "{searchText}" didn't return any previous reports.</p>
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="text-xs text-indigo-750 hover:underline font-bold pt-1 cursor-pointer"
                >
                  Reset Search Filter
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
              <Search className="w-10 h-10 text-slate-300" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">No organized reports on record</p>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Start your search above to trigger active web grounding, analyze facts, and organize findings.
                </p>
              </div>
              <button
                onClick={onNewRequest}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Launch First Mission
              </button>
            </div>
          )}
        </div>

        {/* Right column sidebar: Tips & Features */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Grounding Protocols
            </h4>

            <div className="space-y-3 text-[11px] leading-relaxed text-slate-650">
              <div className="flex gap-2.5">
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-md w-5 h-5 flex items-center justify-center shrink-0">1</span>
                <p>
                  <strong>Parametric Grounding</strong> targets real-time API integrations over static pre-trained variables, preventing hallucinations.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-md w-5 h-5 flex items-center justify-center shrink-0">2</span>
                <p>
                  <strong>Fact extraction</strong> extracts numerical dimensions and lists key organizations/academics mapped out under strategic takeaway widgets.
                </p>
              </div>

              <div className="flex gap-2.5">
                <span className="font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 rounded-md w-5 h-5 flex items-center justify-center shrink-0">3</span>
                <p>
                  <strong>Interactive lab sandbox</strong> keeps documents versatile. Switch editor parameters to refine or prune auto-analyzed transcripts instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
