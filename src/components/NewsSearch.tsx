import React, { useState } from "react";
import { Search, Globe, ChevronRight, ExternalLink, RefreshCw, AlertCircle, Newspaper, ArrowRight } from "lucide-react";

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
}

interface NewsData {
  summary: string;
  news: NewsItem[];
  webSources?: Array<{ title: string; url: string }>;
}

export default function NewsSearch() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NewsData | null>(null);

  // Suggestions for quick news crawl
  const suggestions = [
    "Artificial intelligence breakthrough in healthcare",
    "Global space exploration highlights this month",
    "Renewable energy integration and smart grid updates",
    "Latest quantum computing achievements"
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch("/api/news/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() })
      });

      if (!response.ok) {
        throw new Error("Failed to compile up-to-date news. Try a different query.");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Internal issue fetching latest grounded sources.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="news-search-workspace" className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-650 shrink-0">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Direct Live News Desk</h2>
            <p className="text-xs text-slate-500 font-medium">Auto-grounded news indexer retrieving recent press and developments</p>
          </div>
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2.5 pt-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="news-query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., NASA Artemis launch updates, nuclear fusion breakthroughs..."
              className="w-full bg-slate-50 border border-slate-205 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Crawling Indexers...
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                Crawl Live News
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="pt-1.5 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Popular Live Queries</span>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSearch(suggestion)}
                className="text-[11px] font-semibold text-slate-600 hover:text-indigo-755 hover:bg-indigo-50/50 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-all text-left truncate max-w-xs cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Output */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-800">Crawl Protocol Interruption</h4>
            <p className="text-rose-700 mt-1 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Placeholders */}
      {isLoading && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded-full w-1/3" />
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded-full w-full" />
              <div className="h-3 bg-slate-105 rounded-full w-5/6" />
              <div className="h-3 bg-slate-100 rounded-full w-4/5" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-150 p-5 rounded-xl space-y-3.5 animate-pulse">
                <div className="h-3 bg-slate-150 rounded-full w-1/4" />
                <div className="h-4 bg-slate-100 rounded-full w-3/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="h-3 bg-slate-100 rounded-full w-5/6" />
                </div>
                <div className="h-3 bg-slate-150 rounded-full w-1/3" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Workspace */}
      {data && (
        <div className="space-y-6">
          {/* Executive News Overview */}
          {data.summary && (
            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl shadow-inner space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase bg-indigo-100/60 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full inline-block">
                Synthesis Summary
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {data.summary}
              </p>
            </div>
          )}

          {/* News List / Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-650" />
                Current Active Coverage Headlines
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-650 bg-emerald-50 px-2 py-0.5 rounded-full">
                ✔ Grounded Live
              </span>
            </div>

            {data.news && data.news.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.news.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-sm rounded-xl p-5 transition-all duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-extrabold uppercase bg-slate-100 text-slate-650 px-2 py-0.5 rounded">
                          {item.source || "News Outlet"}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">Recently</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-850 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11.5px] text-slate-500 leading-normal font-medium">
                        {item.summary}
                      </p>
                    </div>

                    {item.url && item.url !== "#" && (
                      <div className="pt-2 border-t border-slate-100">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-indigo-700 hover:text-indigo-850 flex items-center gap-1 transition-colors group cursor-pointer"
                        >
                          Read detailed coverage
                          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-8 text-center rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-semibold">No structured headlines extracted. Review active sources index below.</p>
              </div>
            )}
          </div>

          {/* Web References Cited */}
          {data.webSources && data.webSources.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-[11px] font-bold text-slate-450 uppercase tracking-widest font-mono">
                System News Grounding Citations
              </h4>
              <div className="divide-y divide-slate-100">
                {data.webSources.map((ws, index) => (
                  <div key={index} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <span className="font-mono text-[9.5px] font-bold text-slate-600 bg-slate-50 border border-slate-200 w-5 h-5 rounded flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <a
                        href={ws.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-slate-800 hover:text-indigo-700 hover:underline block truncate cursor-pointer"
                      >
                        {ws.title}
                      </a>
                      <span className="text-[10px] text-slate-400 font-mono select-all truncate block mt-0.5 leading-none">
                        {ws.url}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
