import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetOrgActivityQuery } from "./orgApiSlice";
import {
  Activity,
  Clock,
  User,
  PlusCircle,
  Edit2,
  Move,
  MessageSquare,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  HelpCircle,
  FolderOpen
} from "lucide-react";

// Helper to format date relatively
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OrgActivityFeed = () => {
  const { orgId } = useParams();
  const { data: activityRes, isLoading, error } = useGetOrgActivityQuery(orgId);
  const activities = activityRes?.data || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const getActionIcon = (action) => {
    switch (action) {
      case "created":
        return <PlusCircle className="w-4 h-4 text-emerald-500" />;
      case "updated":
        return <Edit2 className="w-4 h-4 text-blue-500" />;
      case "moved":
        return <Move className="w-4 h-4 text-purple-500" />;
      case "commented":
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case "comment_deleted":
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
      case "deleted":
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case "created":
        return "created a task";
      case "updated":
        return "updated a task";
      case "moved":
        return "moved a task";
      case "commented":
        return "commented on a task";
      case "comment_deleted":
        return "deleted a comment on a task";
      case "deleted":
        return "deleted a task";
      default:
        return "performed an action";
    }
  };

  // Filter activities based on search and selected action filter
  const filteredActivities = activities.filter((act) => {
    // Action filter
    if (filterAction !== "all") {
      if (filterAction === "comments" && !act.action.startsWith("comment")) return false;
      if (filterAction !== "comments" && act.action !== filterAction) return false;
    }

    // Search filter (task title, actor name, project name)
    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      const taskTitle = (act.taskId?.title || act.meta?.title || "").toLowerCase();
      const actorName = (act.actorId?.name || "").toLowerCase();
      const projectName = (act.projectId?.name || "").toLowerCase();
      return (
        taskTitle.includes(query) ||
        actorName.includes(query) ||
        projectName.includes(query)
      );
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="text-sm text-muted-foreground">Loading organization activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 border border-dashed rounded-xl bg-card">
        <h3 className="font-bold text-lg text-destructive">Failed to Load Activity</h3>
        <p className="text-xs text-muted-foreground mt-2">
          {error?.data?.message || "An error occurred while fetching audit trail data."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Organization Activity Feed
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Chronological audit trail of all task modifications, transitions, and discussion updates.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60 backdrop-blur-md">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by task, actor, project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-lg text-sm outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs outline-none focus:border-primary transition-all"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="moved">Moved</option>
            <option value="comments">Comments</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Activities Timeline List */}
      <div className="p-6 rounded-xl border border-border bg-card/40 backdrop-blur-md shadow-sm">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Activity className="w-10 h-10 mx-auto opacity-20 mb-3" />
            <p className="text-sm font-medium">No activity records found</p>
            <p className="text-xs opacity-65 mt-1">
              {searchTerm || filterAction !== "all"
                ? "Try adjusting your search query or filter options."
                : "Work activities will appear here once team members start working on tasks."}
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-border space-y-8">
            {filteredActivities.map((act) => {
              const taskTitle = act.taskId?.title || act.meta?.title || "Deleted Task";
              const isTaskActive = !!act.taskId;

              return (
                <div key={act._id} className="relative group animate-fadeIn">
                  {/* Timeline Dot & Icon */}
                  <span className="absolute -left-[37px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm group-hover:scale-110 transition-transform">
                    {getActionIcon(act.action)}
                  </span>

                  <div className="space-y-1.5">
                    {/* Timestamp & Project */}
                    <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(act.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-primary/80">
                        <FolderOpen className="w-3 h-3" />
                        {act.projectId?.name || "Unknown Project"}
                      </span>
                    </div>

                    {/* Description Sentence */}
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">
                        {act.actorId?.name || "Unknown User"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {getActionLabel(act.action)}
                      </span>{" "}
                      {isTaskActive ? (
                        <Link
                          to={`/orgs/${orgId}/projects/${act.projectId?._id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          "{taskTitle}"
                        </Link>
                      ) : (
                        <span className="font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                          "{taskTitle}"
                        </span>
                      )}
                    </div>

                    {/* Metadata Context Area */}
                    {act.action === "updated" && act.meta?.changes && (
                      <div className="mt-2 p-2.5 rounded-lg bg-secondary/30 border border-border/40 text-xs space-y-1.5 max-w-xl">
                        {Object.entries(act.meta.changes).map(([field, delta]) => {
                          let label = field;
                          if (field === "assigneeId") label = "assignee";
                          if (field === "dueDate") label = "due date";

                          return (
                            <div key={field} className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                              <span className="font-medium capitalize text-foreground/80">{label}:</span>
                              {delta.from ? (
                                <code className="px-1 py-0.5 rounded bg-secondary text-[10px] truncate max-w-[150px]">{delta.from}</code>
                              ) : (
                                <span className="italic opacity-60">none</span>
                              )}
                              <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
                              {delta.to ? (
                                <code className="px-1 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium truncate max-w-[150px]">{delta.to}</code>
                              ) : (
                                <span className="italic opacity-60">removed</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {act.action === "moved" && (act.meta?.from || act.meta?.to) && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-semibold px-1.5 py-0.5 rounded bg-secondary text-[10px] border border-border">
                          {act.meta.from || "Unknown"}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] border border-primary/20">
                          {act.meta.to || "Unknown"}
                        </span>
                      </div>
                    )}

                    {act.action === "commented" && act.meta?.preview && (
                      <div className="mt-2 p-3 rounded-lg bg-secondary/40 border-l-2 border-amber-500 text-xs italic text-muted-foreground max-w-xl truncate">
                        "{act.meta.preview}..."
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgActivityFeed;
