import React, { useState, useEffect } from "react";
import { ResearchProject, Section, ResearchPlan } from "./types";
import Dashboard from "./components/Dashboard";
import ResearchForm from "./components/ResearchForm";
import ResearchOutline from "./components/ResearchOutline";
import ResearchProgress from "./components/ResearchProgress";
import CompiledReportView from "./components/CompiledReportView";
import NewsSearch from "./components/NewsSearch";
import DailyQuiz from "./components/DailyQuiz";
import { Search, Compass, ShieldAlert, Sparkles, AlertCircle, FileText, Globe } from "lucide-react";

export default function App() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [configChecked, setConfigChecked] = useState(true);
  const [configMessage, setConfigMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"builder" | "news" | "quiz">("builder");

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("deep_research_projects");
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse historical research projects:", e);
      }
    }

    // Verify Gemini API Key configuration
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (!data.configured) {
          setConfigChecked(false);
          setConfigMessage(data.message);
        }
      })
      .catch((err) => console.error("Error connecting to server configuration:", err));
  }, []);

  // Save projects to local storage whenever they change
  const saveProjectsToStorage = (updatedList: ResearchProject[]) => {
    setProjects(updatedList);
    localStorage.setItem("deep_research_projects", JSON.stringify(updatedList));
  };

  const currentProject = projects.find((p) => p.id === activeProjectId);

  // Step 1: Formulate research outline plan
  const handleStartResearch = async (config: {
    topic: string;
    focusAreas: string;
    tone: string;
    depth: string;
  }) => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const response = await fetch("/api/research/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Server error formulating outline");
      }

      const planData: ResearchPlan = await response.json();

      const newProject: ResearchProject = {
        id: `project-${Date.now()}`,
        topic: config.topic,
        title: planData.title || `Research: ${config.topic}`,
        scope: planData.scope || "",
        tone: config.tone,
        depth: config.depth,
        status: "outline",
        createdAt: new Date().toISOString(),
        plan: planData,
        sections: planData.sections.map((s) => ({ ...s, status: "idle" }))
      };

      const updated = [newProject, ...projects];
      saveProjectsToStorage(updated);
      setActiveProjectId(newProject.id);
    } catch (e: any) {
      console.error(e);
      setGlobalError(e?.message || "Failed to initiate outline formulating cycle. Verify parameters.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Continuous loop searching and analyzing section-by-section
  const handleLaunchResearch = async () => {
    if (!currentProject) return;

    // Reset all sections to idle, and status of global project to investigating
    const initializedSections = currentProject.sections.map((s) => ({
      ...s,
      status: "idle" as const,
      synthesizedText: undefined,
      keyFacts: undefined,
      sources: undefined,
      error: undefined
    }));

    const updatedProject: ResearchProject = {
      ...currentProject,
      status: "investigating",
      sections: initializedSections
    };

    const nextProjects = projects.map((p) => (p.id === currentProject.id ? updatedProject : p));
    saveProjectsToStorage(nextProjects);

    // Iterative sequential looping on research sections
    let tempSections = [...initializedSections];

    for (let i = 0; i < tempSections.length; i++) {
      // Mark current section as searching/researching
      tempSections[i] = { ...tempSections[i], status: "researching" };
      let inDevProject = { ...updatedProject, sections: [...tempSections] };
      saveProjectsToStorage(projects.map((p) => (p.id === currentProject.id ? inDevProject : p)));

      try {
        const response = await fetch("/api/research/investigate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: currentProject.topic,
            sectionTitle: tempSections[i].title,
            sectionObjective: tempSections[i].objective,
            focusKeywords: tempSections[i].focusKeywords
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Search grounded analyze failed");
        }

        const data = await response.json();

        // Populate section records
        tempSections[i] = {
          ...tempSections[i],
          status: "completed",
          synthesizedText: data.synthesizedText,
          keyFacts: data.keyFacts,
          sources: data.sources
        };
      } catch (err: any) {
        console.error(`Error investigating pillar [${tempSections[i].title}]:`, err);
        tempSections[i] = {
          ...tempSections[i],
          status: "failed",
          error: err?.message || "Grounding analysis timed out"
        };
      }

      // Update state for visual interface
      inDevProject = { ...updatedProject, sections: [...tempSections] };
      saveProjectsToStorage(projects.map((p) => (p.id === currentProject.id ? inDevProject : p)));
    }

    // Step 3: Compile results and finalize executive synthesis report
    const finalSections = [...tempSections];
    const completedSections = finalSections.filter((s) => s.status === "completed");

    if (completedSections.length === 0) {
      // Everything failed
      const failedProject: ResearchProject = {
        ...updatedProject,
        status: "failed",
        sections: finalSections
      };
      saveProjectsToStorage(projects.map((p) => (p.id === currentProject.id ? failedProject : p)));
      return;
    }

    try {
      const response = await fetch("/api/research/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentProject.topic,
          plan: currentProject.plan,
          investigatedSections: completedSections
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Executive report synthesis aborted");
      }

      const finalReport = await response.json();

      const finalProject: ResearchProject = {
        ...updatedProject,
        status: "completed",
        sections: finalSections,
        executiveSummary: finalReport.executiveSummary,
        highlights: finalReport.highlights
      };

      saveProjectsToStorage(projects.map((p) => (p.id === currentProject.id ? finalProject : p)));
    } catch (finalizeErr: any) {
      console.error("Failed to compile final report details:", finalizeErr);
      const partialProject: ResearchProject = {
        ...updatedProject,
        status: "completed", // Still mark compiled so reader can load completed sections
        sections: finalSections,
        executiveSummary: "Executive synthesis compilation encountered server timeouts. Individual sections remain readable below.",
        highlights: []
      };
      saveProjectsToStorage(projects.map((p) => (p.id === currentProject.id ? partialProject : p)));
    }
  };

  const handleUpdatePlan = (updatedPlan: ResearchPlan) => {
    if (!currentProject) return;
    const updated: ResearchProject = {
      ...currentProject,
      title: updatedPlan.title,
      scope: updatedPlan.scope,
      plan: updatedPlan,
      sections: updatedPlan.sections
    };
    saveProjectsToStorage(projects.map((p) => (p.id === currentProject.id ? updated : p)));
  };

  const handleUpdateProject = (updatedProject: ResearchProject) => {
    saveProjectsToStorage(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  const handleDeleteProject = (pId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = projects.filter((p) => p.id !== pId);
    saveProjectsToStorage(updated);
    if (activeProjectId === pId) {
      setActiveProjectId(null);
    }
  };

  const handleSelectProject = (pId: string) => {
    setActiveProjectId(pId);
  };

  const handleResetToDashboard = () => {
    setActiveProjectId(null);
    setGlobalError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans tracking-tight pt-5 pb-16 px-4 md:px-8 selection:bg-indigo-100 selection:text-indigo-900">
      {/* GLOBAL HUD WRAPPER (Fluid central container) */}
      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Banner Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl md:px-6 shadow-sm">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleResetToDashboard}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-900/15">
              <Search className="w-5.5 h-5.5 text-white font-bold" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight md:text-base text-slate-900 flex items-center gap-2">
                DOUGY AI
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-150 px-2.5 py-0.5 rounded-full">Report Builder</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold">Automatic grounded research & organizing findings</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono text-slate-600 shrink-0 select-text bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-bold">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            API Core v3 • <span className="text-emerald-700 font-bold uppercase font-sans tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping inline-block" />Online</span>
          </div>
        </header>

        {/* Global Warnings Panel */}
        {!configChecked && (
          <div id="missing-credentials-panel" className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-800">🔑 Gemini API Credential Configuration Required</p>
              <p className="text-amber-700 font-medium leading-normal animate-pulse">
                {configMessage || "The application is pending environment setups. Please enter your GEMINI_API_KEY in the **Settings > Secrets** control deck to activate grounded web investigative agents."}
              </p>
            </div>
          </div>
        )}

        {globalError && (
          <div id="error-alert-banner" className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5.5 h-5.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-rose-800 font-sans uppercase tracking-wider text-[10px]">System Error Encountered</p>
              <p className="text-rose-700 font-semibold mt-1 leading-relaxed">{globalError}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        {!activeProjectId && (
          <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl gap-1 shadow-sm overflow-x-auto">
            <button
              onClick={() => setCurrentTab("builder")}
              type="button"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "builder"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Compass className="w-4 h-4" />
              Strategic Report Builder
            </button>
            <button
              onClick={() => setCurrentTab("news")}
              type="button"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "news"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Globe className="w-4 h-4" />
              Live News Crawler (Direct Search)
            </button>
            <button
              onClick={() => setCurrentTab("quiz")}
              type="button"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "quiz"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Subject Daily Quizzes
            </button>
          </div>
        )}

        {/* APP orchestrations state */}
        <main className="transition-all duration-300">
          {!currentProject ? (
            currentTab === "builder" ? (
              /* ============================== */
              /* DASHBOARD / NEW FORM           */
              /* ============================== */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Launcher Form */}
                <div className="lg:col-span-7">
                  <ResearchForm onStartResearch={handleStartResearch} isLoading={isLoading} />
                </div>

                {/* High-level details & list past reports */}
                <div className="lg:col-span-5">
                  <Dashboard
                    projects={projects}
                    onSelectProject={handleSelectProject}
                    onDeleteProject={handleDeleteProject}
                    onNewRequest={() => {
                      const el = document.getElementById("research-topic-input");
                      if (el) el.focus();
                    }}
                  />
                </div>
              </div>
            ) : currentTab === "news" ? (
              <NewsSearch />
            ) : (
              <DailyQuiz projects={projects} />
            )
          ) : currentProject.status === "outline" ? (
            /* ============================== */
            /* OUTLINE EDITS MODE              */
            /* ============================== */
            <ResearchOutline
              plan={currentProject.plan!}
              onUpdatePlan={handleUpdatePlan}
              onLaunchResearch={handleLaunchResearch}
              onReset={handleResetToDashboard}
              isLoading={isLoading}
            />
          ) : currentProject.status === "investigating" ? (
            /* ============================== */
            /* RESEARCH PROGRESS MODE         */
            /* ============================== */
            <ResearchProgress
              sections={currentProject.sections}
              topic={currentProject.topic}
              depth={currentProject.depth}
            />
          ) : (
            /* ============================== */
            /* FINAL COMPILED REPORT PREVIEW  */
            /* ============================== */
            <CompiledReportView
              project={currentProject}
              onReset={handleResetToDashboard}
              onUpdateProject={handleUpdateProject}
            />
          )}
        </main>
      </div>
    </div>
  );
}
