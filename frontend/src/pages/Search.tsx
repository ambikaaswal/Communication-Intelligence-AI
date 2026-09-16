"use client";
import { useEffect, useState } from "react";
import { TaskStatusBadge, DecisionTypeBadge } from "../components/StatusBadge";
import { PersonChip } from "../components/PersonChip";
import { Search as SearchIcon, X } from "lucide-react";
import { searchAll, type SearchResults } from "@/services/api";

function highlight(text: string, query: string) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark key={i} className="bg-indigo-500/25 text-indigo-300 rounded-[2px] px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      searchAll(q).then(setResults).finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const hasResults = !!results && results.tasks.length + results.decisions.length + results.conversations.length > 0;

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white/90 tracking-tight mb-6">Search</h1>

        <div className="relative">
          <SearchIcon size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, decisions, conversations…"
            className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/[0.03] transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {!hasQuery && (
        <div className="text-center py-16">
          <p className="text-sm text-white/20">Start typing to search across tasks, decisions, and conversations</p>
        </div>
      )}

      {hasQuery && loading && (
        <div className="text-center py-16">
          <p className="text-sm text-white/20">Searching…</p>
        </div>
      )}

      {hasQuery && !loading && !hasResults && (
        <div className="text-center py-16">
          <p className="text-sm text-white/40">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-white/20 mt-1">Try a different keyword or phrase</p>
        </div>
      )}

      {hasQuery && !loading && hasResults && results && (
        <div className="space-y-8">
          {results.tasks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Tasks</h2>
                <span className="text-xs text-white/20">({results.tasks.length})</span>
              </div>
              <div className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.04] overflow-hidden">
                {results.tasks.map((task) => (
                  <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{highlight(task.title, query)}</p>
                    </div>
                    {task.owner_name && <PersonChip name={task.owner_name} />}
                    <TaskStatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.decisions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Decisions</h2>
                <span className="text-xs text-white/20">({results.decisions.length})</span>
              </div>
              <div className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.04] overflow-hidden">
                {results.decisions.map((d) => (
                  <div key={d.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">{highlight(d.title, query)}</p>
                    </div>
                    {d.decided_by_name && <PersonChip name={d.decided_by_name} />}
                    <DecisionTypeBadge type={d.type} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {results.conversations.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Conversations</h2>
                <span className="text-xs text-white/20">({results.conversations.length})</span>
              </div>
              <div className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.04] overflow-hidden">
                {results.conversations.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <p className="text-sm text-white/80 font-medium mb-0.5">{highlight(c.title, query)}</p>
                    <p className="text-xs text-white/40 line-clamp-2">{highlight(c.summary, query)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}