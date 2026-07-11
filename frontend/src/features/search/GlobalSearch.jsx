import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLazyGlobalSearchQuery } from "./searchApiSlice";
import {
  Search,
  X,
  Loader2,
  CheckSquare,
  Folder,
  User,
  MessageSquare,
  ArrowRight,
  Command,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Result item type metadata
|--------------------------------------------------------------------------
*/
const TYPE_META = {
  task: {
    icon: CheckSquare,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Task",
  },
  project: {
    icon: Folder,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    label: "Project",
  },
  user: {
    icon: User,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    label: "Member",
  },
  message: {
    icon: MessageSquare,
    color: "text-green-500",
    bg: "bg-green-500/10",
    label: "Message",
  },
};

/*
|--------------------------------------------------------------------------
| ResultItem — single search result row
|--------------------------------------------------------------------------
*/
const ResultItem = ({ type, item, orgId, onClose, isHighlighted, onMouseEnter }) => {
  const navigate = useNavigate();
  const meta = TYPE_META[type];
  const Icon = meta.icon;

  const getTitle = () => {
    if (type === "task") return item.title;
    if (type === "project") return item.name;
    if (type === "user") return item.name;
    if (type === "message") return item.content.substring(0, 80);
    return "—";
  };

  const getSubtitle = () => {
    if (type === "task") return `${item.projectId?.key || "?"}-${item.status?.toUpperCase()} · ${item.priority}`;
    if (type === "project") return item.description || item.key;
    if (type === "user") return item.email;
    if (type === "message") return `in #${item.projectId?.name || "project"}`;
    return "";
  };

  const handleClick = () => {
    if (type === "task" && item.projectId?._id) {
      navigate(`/orgs/${orgId}/projects/${item.projectId._id}`);
    } else if (type === "project") {
      navigate(`/orgs/${orgId}/projects/${item._id}`);
    } else if (type === "user") {
      navigate(`/profile`);
    } else if (type === "message" && item.projectId?._id) {
      navigate(`/orgs/${orgId}/projects/${item.projectId._id}`);
    }
    onClose();
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors rounded-lg ${
        isHighlighted ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/60"
      }`}
    >
      {/* Type icon */}
      <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${meta.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">{getTitle()}</div>
        <div className="text-[11px] text-muted-foreground truncate">{getSubtitle()}</div>
      </div>

      {/* Label badge */}
      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} flex-shrink-0`}>
        {meta.label}
      </div>

      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| GlobalSearch — Cmd+K command palette modal
|--------------------------------------------------------------------------
*/
const GlobalSearch = ({ isOpen, onClose }) => {
  const { orgId } = useParams();
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const [triggerSearch, { data: searchRes, isFetching }] = useLazyGlobalSearchQuery();

  // Flatten results into a single navigable list for keyboard nav
  const results = searchRes?.data || { tasks: [], projects: [], users: [], messages: [] };

  const flatResults = [
    ...(results.tasks || []).map((item) => ({ type: "task", item })),
    ...(results.projects || []).map((item) => ({ type: "project", item })),
    ...(results.users || []).map((item) => ({ type: "user", item })),
    ...(results.messages || []).map((item) => ({ type: "message", item })),
  ];

  const totalResults = flatResults.length;
  const hasResults = totalResults > 0;

  // Debounced search trigger
  const handleQueryChange = useCallback(
    (value) => {
      setQuery(value);
      setHighlightedIndex(0);
      clearTimeout(debounceRef.current);
      if (value.trim().length >= 2) {
        debounceRef.current = setTimeout(() => {
          triggerSearch({ q: value.trim(), orgId, type: activeType, limit: 10 });
        }, 300);
      }
    },
    [orgId, activeType, triggerSearch]
  );

  // Re-search when type changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      triggerSearch({ q: query.trim(), orgId, type: activeType, limit: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setActiveType("all");
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % Math.max(totalResults, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => (i - 1 + Math.max(totalResults, 1)) % Math.max(totalResults, 1));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, totalResults, onClose]);

  if (!isOpen) return null;

  const TYPES = [
    { key: "all", label: "All" },
    { key: "task", label: "Tasks" },
    { key: "project", label: "Projects" },
    { key: "user", label: "Members" },
    { key: "message", label: "Messages" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {isFetching ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search tasks, projects, members, messages…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-secondary border border-border rounded text-[10px] text-muted-foreground">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-secondary text-muted-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeType === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <div className="py-10 text-center">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Search across tasks, projects, members and messages
              </p>
            </div>
          ) : isFetching ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No results for <span className="font-semibold text-foreground">"{query}"</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try a different search term or filter
              </p>
            </div>
          ) : (
            <>
              {/* Group by type if showing all */}
              {activeType === "all" ? (
                <>
                  {Object.entries({
                    task: results.tasks,
                    project: results.projects,
                    user: results.users,
                    message: results.messages,
                  }).map(([type, items]) => {
                    if (!items?.length) return null;
                    const meta = TYPE_META[type];
                    return (
                      <div key={type} className="mb-2">
                        <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {meta.label}s
                        </div>
                        {items.map((item, i) => {
                          const flatIdx = flatResults.findIndex(
                            (r) => r.type === type && r.item._id === item._id
                          );
                          return (
                            <ResultItem
                              key={item._id}
                              type={type}
                              item={item}
                              orgId={orgId}
                              onClose={onClose}
                              isHighlighted={highlightedIndex === flatIdx}
                              onMouseEnter={() => setHighlightedIndex(flatIdx)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ) : (
                flatResults.map(({ type, item }, idx) => (
                  <ResultItem
                    key={item._id}
                    type={type}
                    item={item}
                    orgId={orgId}
                    onClose={onClose}
                    isHighlighted={highlightedIndex === idx}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/20 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-secondary border border-border rounded text-[9px]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-secondary border border-border rounded text-[9px]">↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-secondary border border-border rounded text-[9px]">Esc</kbd>
              close
            </span>
          </div>
          {hasResults && (
            <span>{totalResults} result{totalResults !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
