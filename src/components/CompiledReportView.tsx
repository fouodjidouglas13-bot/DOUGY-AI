import React, { useState } from "react";
import { ResearchProject, Section } from "../types";
import {
  FileText,
  Copy,
  Check,
  Download,
  Share2,
  Printer,
  ChevronRight,
  BookOpen,
  Edit,
  CheckSquare,
  Undo2,
  Compass,
  ArrowLeft,
  MessageSquare,
  ClipboardCheck,
  Send,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  HelpCircle
} from "lucide-react";
import DataVisualization from "./DataVisualization";

interface ReportProps {
  project: ResearchProject;
  onReset: () => void;
  onUpdateProject: (updatedProject: ResearchProject) => void;
}

export default function CompiledReportView({ project, onReset, onUpdateProject }: ReportProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"read" | "edit" | "chat" | "audit">("read");
  
  // Local state for edits
  const [editedExecutive, setEditedExecutive] = useState(project.executiveSummary || "");
  const [editedSections, setEditedSections] = useState<Record<string, string>>(
    project.sections.reduce((acc, s) => {
      acc[s.id] = s.synthesizedText || "";
      return acc;
    }, {} as Record<string, string>)
  );

  const [activeSectionId, setActiveSectionId] = useState<string>("executive-summary");

  // Interaction: Chat about the report
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "model"; content: string }>>([
    {
      role: "model",
      content: `Hello! I'm your interactive **Research Co-Pilot**. I've digested the completed report: **"${project.title}"**.\n\nYou can ask me to: \n- Explain technical terms or concepts in detail\n- Summarize certain chapters or draft comparative summaries\n- Strategize opportunities and explore alternate scenarios based on our data.`
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Interaction: Performance and Peer Audit
  const [auditData, setAuditData] = useState<{
    score: number;
    strengths: string[];
    gaps: string[];
    counterarguments: string[];
    followUps: string[];
  } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Send message to the report-focused chatbot
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatError(null);

    // Append user message local-state
    const nextMessages = [...chatMessages, { role: "user" as const, content: userText }];
    setChatMessages(nextMessages);
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/ai/chat-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          topic: project.topic,
          executiveSummary: editedExecutive,
          sections: project.sections.map(s => ({
            title: s.title,
            synthesizedText: editedSections[s.id] || s.synthesizedText || ""
          })),
          messages: nextMessages
        })
      });

      if (!response.ok) {
        throw new Error("Chat engine encountered a communication issue. Please retry.");
      }

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "model" as const, content: data.reply }]);
    } catch (err: any) {
      console.error(err);
      setChatError(err?.message || "Failed to transmit inquiry to report assistant.");
    } finally {
      setIsSendingChat(false);
    }
  };

  // Run scientific audit helper
  const handleRunQualityAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const response = await fetch("/api/ai/audit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          topic: project.topic,
          executiveSummary: editedExecutive,
          sections: project.sections.map(s => ({
            title: s.title,
            synthesizedText: editedSections[s.id] || s.synthesizedText || ""
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Peer reviewer was unable to complete assessment.");
      }

      const auditResult = await response.json();
      setAuditData(auditResult);
    } catch (err: any) {
      console.error(err);
      setAuditError(err?.message || "Error processing report content analysis.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Custom Markdown parser to styled HTML that handles inline citations e.g. [1] or [2]
  const parseMarkdownToHTML = (text: string, sources: Array<{ title: string; url: string }> = []) => {
    if (!text) return null;

    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("### ")) {
        return <h4 key={lineIdx} className="text-sm font-bold text-slate-100 hover:text-indigo-400 transition-colors uppercase tracking-tight mt-5 mb-2">{trimmed.substring(4)}</h4>;
      }
      if (trimmed.startsWith("## ")) {
        return <h3 key={lineIdx} className="text-base font-bold text-slate-100 hover:text-indigo-400 transition-colors border-b border-slate-800/60 pb-1 mt-7 mb-3.5 flex items-center gap-2">{trimmed.substring(3)}</h3>;
      }
      if (trimmed.startsWith("# ")) {
        return <h2 key={lineIdx} className="text-lg font-extrabold text-indigo-400 mt-8 mb-4">{trimmed.substring(2)}</h2>;
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={lineIdx} className="border-l-4 border-indigo-500/40 bg-slate-950/40 p-3 rounded-r-lg my-3 text-[12.5px] italic text-slate-400">
            {trimmed.substring(2)}
          </blockquote>
        );
      }

      // Bullets
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={lineIdx} className="text-[12.5px] leading-relaxed text-slate-300 ml-5 list-disc my-1.5 pl-1">
            {parseInsetTextCitations(trimmed.substring(2), sources)}
          </li>
        );
      }

      // Ordered Bullets
      if (/^\d+\.\s/.test(trimmed)) {
        const dotIdx = trimmed.indexOf(" ");
        return (
          <li key={lineIdx} className="text-[12.5px] leading-relaxed text-slate-300 ml-5 list-decimal my-1.5 pl-1 font-sans">
            {parseInsetTextCitations(trimmed.substring(dotIdx + 1), sources)}
          </li>
        );
      }

      // Standard Paragraph
      if (trimmed === "") return <div key={lineIdx} className="h-2.5" />;
      return (
        <p key={lineIdx} className="text-[12.5px] leading-relaxed text-slate-300 my-2.5 text-justify">
          {parseInsetTextCitations(line, sources)}
        </p>
      );
    });
  };

  // Parses [1] in text to a styled clickable hyperlink superscript
  const parseInsetTextCitations = (text: string, sources: Array<{ title: string; url: string }> = []) => {
    // Regex matches [1], [2], [12], etc.
    const citationRegex = /\[(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const citationNumber = parseInt(match[1]);
      
      // Push leading text part
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex));
      }

      // Push real citation
      const source = sources[citationNumber - 1];
      if (source && source.url !== "#") {
        parts.push(
          <a
            key={matchIndex}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            title={source.title}
            className="text-indigo-400 hover:text-indigo-300 font-mono text-[9px] font-bold bg-indigo-950/70 border border-indigo-900/40 px-1 py-[1.5px] rounded mx-0.5 transition-all cursor-pointer align-super"
          >
            {citationNumber}
          </a>
        );
      } else {
        parts.push(
          <span key={matchIndex} className="text-slate-500 font-mono text-[9px] align-super px-[2px]">
            [{citationNumber}]
          </span>
        );
      }

      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  // Compile final markdown for export
  const buildFullMarkdownText = () => {
    let md = `# ${project.title}\n\n`;
    md += `**Topic:** ${project.topic}\n`;
    md += `**Tone:** ${project.tone} • **Depth:** ${project.depth}\n`;
    md += `**Compiled:** ${new Date(project.createdAt).toLocaleDateString()}\n\n`;
    md += `## Executive Summary\n\n${editedExecutive}\n\n`;
    
    project.sections.forEach((s) => {
      const text = editedSections[s.id] || s.synthesizedText || "";
      md += `## ${s.title}\n\n${text}\n\n`;
      if (s.sources && s.sources.length > 0) {
        md += `*Sources for ${s.title}:*\n`;
        s.sources.forEach((src, idx) => {
          md += `[${idx + 1}] [${src.title}](${src.url})\n`;
        });
        md += "\n";
      }
    });

    return md;
  };

  const handleCopyMarkdown = () => {
    const fullText = buildFullMarkdownText();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const fullText = buildFullMarkdownText();
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.md`;
    const blob = new Blob([fullText], { type: "text/markdown;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveChanges = () => {
    // Sync edited contents back into the state
    const updatedSections = project.sections.map((s) => ({
      ...s,
      synthesizedText: editedSections[s.id] || s.synthesizedText
    }));

    onUpdateProject({
      ...project,
      executiveSummary: editedExecutive,
      sections: updatedSections
    });

    setActiveTab("read");
  };

  const handlePrint = () => {
    window.print();
  };

  // Consolidating all references used across different sections
  const allSources: Array<{ title: string; url: string }> = [];
  const sourceIndexMap = new Map<string, number>();

  project.sections.forEach((s) => {
    (s.sources || []).forEach((src) => {
      const key = `${src.title}-${src.url}`;
      if (!sourceIndexMap.has(key)) {
        allSources.push(src);
        sourceIndexMap.set(key, allSources.length);
      }
    });
  });  // Flat array of all compiled key facts for metrics charts
  const allFacts = project.sections.flatMap((s) => s.keyFacts || []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Sidebar Table of Contents & Strategic Actions */}
      <div className="xl:col-span-3 space-y-5">
        {/* Actions panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <button
            onClick={onReset}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Back to Workspace
          </button>

          <div className="h-px bg-slate-200/80 my-2" />

          {/* Export suite */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Export Report
            </span>

            <button
              onClick={handleCopyMarkdown}
              className="w-full text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 hover:border-slate-300 text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-between cursor-pointer font-sans"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-indigo-600" />
                Raw Markdown Source
              </span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="w-full text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 hover:border-slate-300 text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-between cursor-pointer font-sans"
            >
              <span className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                Download Document
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={handlePrint}
              className="w-full text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 hover:border-slate-300 text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-between cursor-pointer font-sans"
            >
              <span className="flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                Print-friendly view
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <div className="h-px bg-slate-200/80 my-2" />

          {/* Workspace Views Switcher */}
          <div className="space-y-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="block text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-2 pt-1.5 pb-1">
              Active Workspace
            </span>
            <button
              onClick={() => setActiveTab("read")}
              className={`w-full py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === "read" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/40"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-505" />
              Document Reader
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`w-full py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === "edit" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/40"
              }`}
            >
              <Edit className="w-3.5 h-3.5 text-indigo-505" />
              Document Lab
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`w-full py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === "chat" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/40"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-505" />
              Report AI Q&A Desk
              <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-indigo-50 border border-indigo-150 text-indigo-700 ml-auto leading-none">AI</span>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full py-2 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                activeTab === "audit" ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60" : "text-slate-600 hover:text-slate-850 hover:bg-slate-200/40"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-505" />
              Peer Review Audit
              <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-indigo-50 border border-indigo-150 text-indigo-700 ml-auto leading-none">AI</span>
            </button>
          </div>
        </div>

        {/* Table of Contents sidebar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            Table of Contents
          </span>

          <nav className="space-y-1">
            <button
              onClick={() => {
                const el = document.getElementById("executive-summary-anchor");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                setActiveSectionId("executive-summary");
              }}
              className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSectionId === "executive-summary"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold shadow-sm"
                  : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50 font-medium"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">Executive Summary</span>
            </button>

            {/* Strategic highlights gauge */}
            {project.highlights && project.highlights.length > 0 && (
              <button
                onClick={() => {
                  const el = document.getElementById("assessment-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  setActiveSectionId("assessment");
                }}
                className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeSectionId === "assessment"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold shadow-sm"
                    : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50 font-medium"
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate">Metrics & Indicators</span>
              </button>
            )}

            {/* Inidivual pillars links */}
            {project.sections.map((s, sIdx) => (
              <button
                key={s.id}
                onClick={() => {
                  const el = document.getElementById(`section-anchor-${s.id}`);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                  setActiveSectionId(s.id);
                }}
                className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeSectionId === s.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold shadow-sm"
                    : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50 font-medium"
                }`}
              >
                <span className={`font-mono text-[9px] w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                  activeSectionId === s.id ? "bg-white border-indigo-200 text-indigo-700 font-bold" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}>
                  {sIdx + 1}
                </span>
                <span className="truncate">{s.title}</span>
              </button>
            ))}

            <button
              onClick={() => {
                const el = document.getElementById("sources-anchor");
                if (el) el.scrollIntoView({ behavior: "smooth" });
                setActiveSectionId("sources");
              }}
              className={`w-full text-left text-xs py-2 px-2.5 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSectionId === "sources"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold shadow-sm"
                  : "text-slate-600 hover:text-indigo-650 hover:bg-slate-50 font-medium"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate">Sources Bibliography</span>
            </button>
          </nav>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Document Sandbox */}
      <div className="xl:col-span-9">
        {activeTab === "read" ? (
          /* ================================= */
          /* READER MODE                       */
          /* ================================= */
          <div
            id="print-document"
            className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm space-y-8 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none"
          >
            {/* Header Title Block */}
            <div className="border-b border-slate-200 pb-6 print:border-black print:pb-4">
              <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-1 rounded-full font-bold inline-block mb-3.5 print:hidden">
                Publication-Ready AI Research
              </span>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-extrabold text-slate-900 tracking-tight leading-snug print:text-black">
                {project.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-5 mt-4 text-[11px] text-slate-500 print:text-black print:scale-95 origin-left">
                <span className="font-sans leading-none">
                  Subject: <strong className="text-slate-800 print:text-black font-semibold">{project.topic}</strong>
                </span>
                <span className="h-3 w-px bg-slate-200 print:hidden" />
                <span className="font-sans leading-none">
                  Style: <strong className="text-slate-800 print:text-black font-semibold">{project.tone}</strong>
                </span>
                <span className="h-3 w-px bg-slate-200 print:hidden" />
                <span className="font-mono leading-none">
                  Depth: <strong className="text-slate-800 print:text-black font-bold">{project.depth}</strong>
                </span>
                <span className="h-3 w-px bg-slate-200 print:hidden" />
                <span className="font-mono leading-none">
                  Date: <strong className="text-slate-700">{new Date(project.createdAt).toLocaleDateString()}</strong>
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-10">
              
              {/* Executive Summary Anchor */}
              <div id="executive-summary-anchor" className="scroll-mt-6">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-indigo-100 pb-2 flex items-center gap-2 print:text-black print:border-black font-sans">
                  <FileText className="w-4.5 h-4.5 text-indigo-600 print:hidden" />
                  Executive Summary
                </h3>
                <div className="mt-4 text-slate-700 font-serif leading-relaxed text-sm antialiased print:text-black">
                  {parseMarkdownToHTML(editedExecutive || project.executiveSummary || "", allSources)}
                </div>
              </div>

              {/* Data Visualization Overlay */}
              {project.highlights && project.highlights.length > 0 && (
                <div id="assessment-anchor" className="scroll-mt-6 pt-2">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-indigo-100 pb-2 flex items-center gap-2 mb-4 print:hidden font-sans">
                    <Compass className="w-4.5 h-4.5 text-indigo-600" />
                    Key Strategic Indicators
                  </h3>
                  <DataVisualization highlights={project.highlights} facts={allFacts} />
                </div>
              )}

              {/* Pillars list rendering */}
              {project.sections.map((s, index) => {
                const editedContent = editedSections[s.id] || s.synthesizedText || "";
                return (
                  <div key={s.id} id={`section-anchor-${s.id}`} className="scroll-mt-6 pt-6 border-t border-slate-200 print:border-black/20">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-6 h-6 rounded-md bg-indigo-50 font-mono text-[11px] font-bold text-indigo-700 border border-indigo-150 flex items-center justify-center shrink-0 print:hidden">
                        {index + 1}
                      </span>
                      <h2 className="text-base md:text-lg font-extrabold text-slate-900 print:text-black font-sans leading-snug">
                        {s.title}
                      </h2>
                    </div>

                    <div className="mt-2 text-slate-705 font-serif leading-relaxed text-sm antialiased max-w-none print:text-black">
                      {parseMarkdownToHTML(editedContent, s.sources || [])}
                    </div>
                  </div>
                );
              })}

              {/* Consolidated Bibliography */}
              <div id="sources-anchor" className="scroll-mt-6 pt-6 border-t border-slate-200 print:border-black">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 print:text-black font-sans">
                  <BookOpen className="w-4.5 h-4.5 text-indigo-600 print:hidden" />
                  Consolidated Web Citations & Sources
                </h3>

                {allSources.length > 0 ? (
                  <ol className="space-y-4 pl-1">
                    {allSources.map((src, index) => (
                      <li key={index} className="flex items-start gap-3.5 text-xs">
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md min-w-[22px] h-[22px] flex items-center justify-center shrink-0 print:border-black print:text-black font-bold">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-serif font-bold text-slate-800 hover:text-indigo-700 transition-colors hover:underline text-[13px] break-all flex items-center gap-1 leading-normal print:text-black"
                          >
                            {src.title}
                          </a>
                          <span className="block text-[11px] text-slate-450 font-mono select-all break-all pr-4 mt-0.5 leading-none font-medium">
                            {src.url}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-slate-500 italic mt-2">
                    No web sources were explicitly indexed in this analysis.
                  </p>
                )}
              </div>

            </div>
          </div>
        ) : activeTab === "edit" ? (
          /* ================================= */
          /* EDITOR MODE / DOCUMENT LAB        */
          /* ================================= */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit className="w-4.5 h-4.5 text-indigo-600" />
                  Grounded Document Lab
                </h3>
                <p className="text-[11.5px] text-slate-500 mt-1 font-semibold">
                  Direct state editor. Clean markdown formats will compile instantly back to the styled reader canvas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("read")}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Discard Edits
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Save Compilation
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Exec Summary Edit box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Executive Summary Draft
                </label>
                <textarea
                  value={editedExecutive}
                  onChange={(e) => setEditedExecutive(e.target.value)}
                  rows={6}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3.5 text-xs text-slate-700 outline-none font-mono focus:ring-1 focus:ring-indigo-500/30 leading-relaxed transition-all"
                />
              </div>

              {/* Sections Edit map */}
              {project.sections.map((s, sIdx) => (
                <div key={s.id} className="pt-5 border-t border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-4 h-4 bg-slate-100 font-mono text-[9.5px] rounded flex items-center justify-center border border-slate-200 text-slate-500 font-bold">
                      {sIdx + 1}
                    </span>
                    {s.title} Draft
                  </label>
                  <textarea
                    value={editedSections[s.id] || ""}
                    onChange={(e) => {
                      const text = e.target.value;
                      setEditedSections((prev) => ({ ...prev, [s.id]: text }));
                    }}
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl p-3.5 text-xs text-slate-700 outline-none font-mono focus:ring-1 focus:ring-indigo-500/30 leading-relaxed transition-all"
                  />
                </div>
              ))}
            </div>

            {/* Bottom stick Save button */}
            <div className="pt-4 border-t border-slate-205 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveChanges}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4" />
                Store Changes & Sync Reader
              </button>
            </div>
          </div>
        ) : activeTab === "chat" ? (
          /* ================================= */
          /* INTERACTIVE REPORT AI CHAT DESK   */
          /* ================================= */
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 flex flex-col h-[650px]">
            {/* Chat header area */}
            <div className="border-b border-slate-200 pb-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shrink-0">
                <MessageSquare className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-tight text-slate-900">Interactive Report Co-Pilot</h3>
                <p className="text-[10px] text-slate-500 font-bold">Conversational indexer grounded entirely on current drafted findings</p>
              </div>
            </div>

            {/* Chat history list */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {msg.role !== "user" && (
                    <div className="w-6 h-6 rounded-md bg-indigo-600 font-bold text-[10px] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      AI
                    </div>
                  )}
                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed font-sans ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white font-medium"
                        : "bg-slate-100 text-slate-800 border border-slate-200/60 font-medium whitespace-pre-wrap"
                    }`}
                  >
                    {msg.role === "user" ? msg.content : (
                      <div className="space-y-1 text-[12.5px]">
                        {parseMarkdownToHTML(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isSendingChat && (
                <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                  <div className="w-6 h-6 rounded-md bg-indigo-600 font-bold text-[10px] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    AI
                  </div>
                  <div className="bg-slate-100 rounded-2xl px-4 py-3 text-xs text-slate-550 border border-slate-200/60 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-0" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce delay-300" />
                    Consolidating sections...
                  </div>
                </div>
              )}

              {chatError && (
                <div className="bg-rose-50 border border-rose-250 p-3 rounded-xl text-[11px] text-rose-700 font-bold">
                  ⚠️ Error responding: {chatError}
                </div>
              )}
            </div>

            {/* Quick Inquiry Chips */}
            {chatMessages.length === 1 && !isSendingChat && (
              <div className="pt-2 space-y-1.5">
                <span className="block text-[9.5px] font-mono text-slate-400 font-bold uppercase tracking-wider pl-1">Quick Discovery Inquiries</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setChatInput("Based on our report, give me a highly critical SWOT Analysis detailing opportunities.");
                    }}
                    className="text-[10px] bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 font-bold rounded-lg px-2.5 py-1.5 transition-all text-left max-w-xs cursor-pointer"
                  >
                    📋 Direct SWOT Assessment
                  </button>
                  <button
                    onClick={() => {
                      setChatInput("Identify what important metrics or data points are missing from our content sections.");
                    }}
                    className="text-[10px] bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 font-bold rounded-lg px-2.5 py-1.5 transition-all text-left max-w-xs cursor-pointer"
                  >
                    ⚠️ Identify Content Gaps
                  </button>
                  <button
                    onClick={() => {
                      setChatInput("Create a brief 3-sentence elevator pitch summarizing our findings for a non-technical stakeholder.");
                    }}
                    className="text-[10px] bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 font-bold rounded-lg px-2.5 py-1.5 transition-all text-left max-w-xs cursor-pointer"
                  >
                    💡 Elevator Summary Pitch
                  </button>
                </div>
              </div>
            )}

            {/* Interactive chat bottom bar */}
            <form onSubmit={handleSendChatMessage} className="border-t border-slate-200 pt-3 flex items-center gap-2.5">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isSendingChat ? "Formulating response..." : "Ask follow-ups (e.g. 'Synthesise a press release from this report')..."}
                disabled={isSendingChat}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all font-sans font-semibold"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* ================================= */
          /* PEER REVIEW AUDIT MODE            */
          /* ================================= */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 shrink-0">
                  <ClipboardCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-tight text-slate-900">Peer-Review Quality Dashboard</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Deep analytical check analyzing structure strengths, omissions and risks</p>
                </div>
              </div>

              {auditData && (
                <button
                  type="button"
                  onClick={handleRunQualityAudit}
                  disabled={isAuditing}
                  className="bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 hover:border-indigo-300 text-indigo-700 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isAuditing ? "animate-spin" : ""}`} />
                  Re-Audit Report
                </button>
              )}
            </div>

            {auditError && (
              <div className="bg-rose-50 border border-rose-250 p-4 rounded-xl text-xs text-rose-700 font-bold">
                ⚠️ Assessment interruption: {auditError}
              </div>
            )}

            {!auditData ? (
              <div className="py-12 flex flex-col items-center text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center relative">
                  <ClipboardCheck className="w-7 h-7 text-indigo-500 relative z-10" />
                  <span className="absolute -top-0.5 -right-0.5 block w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 block w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Initialize Scientific Peer Review</h4>
                  <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed mt-1">
                    Let Gemini peer-review this document. We'll grade readability depth, flag analytical holes, alternative theories, and recommended paths.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunQualityAudit}
                  disabled={isAuditing}
                  className="bg-indigo-650 hover:bg-indigo-755 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-5 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer w-full justify-center"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Benchmarking report content...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      Begin Report Quality Audit
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metric circular score block */}
                <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50/70 border border-slate-200 px-5 py-4 rounded-xl">
                  {/* Glowing Indicator bar */}
                  <div className="relative w-20 h-20 shrink-0 select-none">
                    <svg className="w-full h-full transform -rotate-9.5" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-indigo-600 stroke-dasharray-[number] transition-all duration-1000"
                        strokeDasharray={`${auditData.score}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-slate-800 text-lg leading-none">
                      {auditData.score}<span className="text-[10px] font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="text-center md:text-left">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 justify-center md:justify-start">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      Analytical Integrity Match: {auditData.score >= 85 ? "Excellent" : "Satisfactory"}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-semibold leading-relaxed">
                      Score reflects structural coverage, density of citations parsed, clarity of logical progression, and fact consistency index. Grade can be improved by adding explicit focus scope metrics.
                    </p>
                  </div>
                </div>

                {/* Audit grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Strengths block */}
                  <div className="border border-emerald-100 bg-emerald-50/20 p-4.5 rounded-xl space-y-2">
                    <span className="block text-[10px] text-emerald-700 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      Academic Content Strengths
                    </span>
                    <ul className="space-y-1.5 pl-1">
                      {auditData.strengths.map((s, idx) => (
                        <li key={idx} className="text-[11.5px] leading-relaxed text-slate-700 flex items-start gap-1.5 font-medium">
                          <span className="text-emerald-550 font-bold shrink-0 mt-0.5">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Vulnerabilities and gaps */}
                  <div className="border border-amber-100 bg-amber-50/20 p-4.5 rounded-xl space-y-2">
                    <span className="block text-[10px] text-amber-700 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Knowledge Gaps & Omissions
                    </span>
                    <ul className="space-y-1.5 pl-1">
                      {auditData.gaps.map((g, idx) => (
                        <li key={idx} className="text-[11.5px] leading-relaxed text-slate-700 flex items-start gap-1.5 font-medium">
                          <span className="text-amber-550 font-bold shrink-0 mt-0.5">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  {/* Alternate schools of thoughts */}
                  <div className="border border-slate-200 bg-slate-50/40 p-4.5 rounded-xl space-y-2">
                    <span className="block text-[10px] text-slate-600 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                      Strategic Counterclaims
                    </span>
                    <ul className="space-y-1.5 pl-1">
                      {auditData.counterarguments.map((ca, idx) => (
                        <li key={idx} className="text-[11.5px] leading-relaxed text-slate-700 flex items-start gap-1.5 font-medium">
                          <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                          <span>{ca}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Follow ups studies */}
                  <div className="border border-indigo-100 bg-indigo-50/10 p-4.5 rounded-xl space-y-2">
                    <span className="block text-[10px] text-indigo-700 font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                      <ClipboardCheck className="w-3.5 h-3.5 text-indigo-505" />
                      Recommended Next Vectors
                    </span>
                    <ul className="space-y-1.5 pl-1">
                      {auditData.followUps.map((fu, idx) => (
                        <li key={idx} className="text-[11.5px] leading-relaxed text-indigo-950 flex items-start gap-1.5 font-bold">
                          <span className="text-indigo-650 font-bold shrink-0 mt-0.5">→</span>
                          <span>{fu}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
