import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ResearchProject } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";
import { TrendingUp, Calendar, Info, BarChart2 } from "lucide-react";

interface TrendAnalysisProps {
  projects: ResearchProject[];
}

export default function TrendAnalysis({ projects = [] }: TrendAnalysisProps) {
  const [chartType, setChartType] = useState<"cumulative" | "volume">("cumulative");

  // 1. Sort projects by creation date ascending
  const sortedProjects = [...projects]
    .filter((p) => p.createdAt)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // 2. Generate Cumulative data
  let cumulativeCount = 0;
  const cumulativeData = sortedProjects.map((p) => {
    cumulativeCount += 1;
    const dateObj = new Date(p.createdAt);
    const label = dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    return {
      timestamp: dateObj.getTime(),
      label,
      title: p.title || p.topic,
      depth: p.depth,
      reportsCreated: cumulativeCount,
      incremental: 1
    };
  });

  // 3. Generate Daily Volume / Grouped Data (Group by date)
  const groupedByDate: { [key: string]: { label: string; count: number; topics: string[] } } = {};
  sortedProjects.forEach((p) => {
    const dateObj = new Date(p.createdAt);
    const dateKey = dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = {
        label: dateKey,
        count: 0,
        topics: []
      };
    }
    groupedByDate[dateKey].count += 1;
    groupedByDate[dateKey].topics.push(p.title || p.topic);
  });

  const dailyVolumeData = Object.values(groupedByDate);

  // Custom tooltip renderer for a clean high-contrast presentation matching our brand
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white border border-slate-205 p-3.5 rounded-xl shadow-lg space-y-1.5 max-w-xs text-xs font-sans">
          <div className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            {dataPoint.label}
          </div>
          <div className="text-slate-900 font-extrabold flex items-center justify-between gap-4">
            <span>{chartType === "cumulative" ? "Report Timeline Mark" : "Daily Creations"}</span>
            <span className="text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded font-mono font-bold">
              {chartType === "cumulative" ? `#${dataPoint.reportsCreated}` : `${dataPoint.count} reports`}
            </span>
          </div>
          {chartType === "cumulative" && dataPoint.title && (
            <div className="pt-1.5 border-t border-slate-100 space-y-1">
              <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Report Topic</span>
              <p className="font-bold text-slate-700 truncate">{dataPoint.title}</p>
              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.25 rounded">
                Depth: {dataPoint.depth}
              </span>
            </div>
          )}
          {chartType === "volume" && dataPoint.topics && dataPoint.topics.length > 0 && (
            <div className="pt-1.5 border-t border-slate-100 space-y-1">
              <span className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide">Included Topics</span>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-600 font-medium">
                {dataPoint.topics.slice(0, 3).map((topic: string, i: number) => (
                  <li key={i} className="truncate">{topic}</li>
                ))}
                {dataPoint.topics.length > 3 && (
                  <li className="text-slate-400 italic">+{dataPoint.topics.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="trend-analysis-panel"
      className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5"
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-650 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Report Velocity & Trend Analysis</h3>
            <p className="text-xs text-slate-500 font-bold">Chronological tracking of generated strategic insights</p>
          </div>
        </div>

        {/* Chart Type Switches */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType("cumulative")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === "cumulative"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/20"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Cumulative Growth
          </button>
          <button
            type="button"
            onClick={() => setChartType("volume")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              chartType === "volume"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/20"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Creations Vol
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="h-60 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <BarChart2 className="w-8 h-8 text-slate-350" />
          <p className="text-xs font-bold text-slate-700">Awaiting Historical Records</p>
          <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
            The trend visualizer groups your activity metrics as reports generate. Synthesize your first report to unlock live graphs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Visualizer Stage */}
          <div className="h-64 w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={chartType}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "cumulative" ? (
                    <AreaChart
                      data={cumulativeData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontFamily="JetBrains Mono, monospace"
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        fontFamily="JetBrains Mono, monospace"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="reportsCreated"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <LineChart
                      data={dailyVolumeData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontFamily="JetBrains Mono, monospace"
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        fontFamily="JetBrains Mono, monospace"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3, stroke: "#10b981", strokeWidth: 1, fill: "#ffffff" }}
                        activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Context footer insights */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="text-[11px] text-slate-500 leading-normal">
              <span className="font-bold text-slate-800">Dynamic Velocity Map:</span> Since inception, your account has logged{" "}
              <strong className="text-indigo-700">{projects.length} research cycles</strong> across varied subjects. Cumulative views identify growth milestones, while Creations Volume monitors peak daily engagement schedules.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
