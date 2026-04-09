import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaBullseye,
  FaBook,
  FaLightbulb,
  FaUsers,
  FaStar,
} from "react-icons/fa";
import { api } from "@/utils/api";

const ICONS: Record<string, any> = {
  goal: FaBullseye,
  course: FaBook,
  career_skill: FaLightbulb,
  custom_skill: FaStar,
  post: FaUsers,
};

const ROUTES: Record<string, string> = {
  goal: "/goals",
  course: "/learning",
  career_skill: "/skills",
  custom_skill: "/skills",
  post: "/community",
};

const COLORS: Record<string, string> = {
  goal: "text-primary bg-primary/10",
  course: "text-blue-500 bg-blue-50",
  career_skill: "text-secondary bg-secondary/10",
  custom_skill: "text-yellow-500 bg-yellow-50",
  post: "text-green-500 bg-green-50",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Open with Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setResults(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data);
      } catch {
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const handleGo = (type: string) => {
    navigate(ROUTES[type] || "/dashboard");
    setOpen(false);
    setQuery("");
    setResults(null);
  };

  const allItems = results
    ? [
        ...results.goals,
        ...results.courses,
        ...results.skills,
        ...results.customSkills,
        ...results.posts,
      ]
    : [];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-muted hover:bg-accent px-4 py-2 rounded-xl text-sm text-foreground-muted transition-all"
      >
        <FaSearch className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search anything...</span>
        <span className="hidden sm:inline text-xs bg-background border border-border px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-start justify-center z-50 pt-20 p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <FaSearch className="text-foreground-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search goals, courses, skills, posts..."
            className="flex-1 bg-transparent text-foreground placeholder:text-foreground-muted outline-none text-base"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults(null);
              }}
              className="text-foreground-muted hover:text-foreground"
            >
              <FaTimes />
            </button>
          )}
          <button
            onClick={() => {
              setOpen(false);
              setQuery("");
              setResults(null);
            }}
            className="text-xs text-foreground-muted border border-border px-2 py-1 rounded hover:bg-muted"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="px-5 py-8 text-center text-foreground-muted">
              <FaSearch className="text-3xl mx-auto mb-2 opacity-20" />
              <p className="text-sm">Type at least 2 characters to search</p>
              <p className="text-xs mt-1">
                Search across goals, courses, skills, and community posts
              </p>
            </div>
          )}

          {!loading && results && allItems.length === 0 && (
            <div className="px-5 py-8 text-center text-foreground-muted">
              <p className="font-medium">No results for "{query}"</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          )}

          {!loading && allItems.length > 0 && (
            <div className="py-2">
              {/* Group by type */}
              {(
                [
                  "goal",
                  "course",
                  "career_skill",
                  "custom_skill",
                  "post",
                ] as const
              ).map((type) => {
                const items = allItems.filter((i: any) => i.type === type);
                if (!items.length) return null;
                const Icon = ICONS[type];
                const labels: Record<string, string> = {
                  goal: "Goals",
                  course: "Courses",
                  career_skill: "Skills",
                  custom_skill: "Other Skills",
                  post: "Community Posts",
                };
                return (
                  <div key={type}>
                    <p className="text-xs text-foreground-muted font-semibold uppercase tracking-wide px-5 py-1.5">
                      {labels[type]}
                    </p>
                    {items.map((item: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleGo(type)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted transition-all text-left"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${COLORS[type]}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.title ||
                              item.name ||
                              item.skillName ||
                              item.content}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {item.category ||
                              item.status ||
                              item.skillTag ||
                              ""}
                          </p>
                        </div>
                        <span className="text-xs text-foreground-muted shrink-0">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {allItems.length > 0 && (
          <div className="px-5 py-2 border-t border-border bg-muted/50">
            <p className="text-xs text-foreground-muted">
              {results?.total} result{results?.total !== 1 ? "s" : ""} · Press
              Esc to close
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
