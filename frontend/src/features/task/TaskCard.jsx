import { Calendar, User, AlertCircle, MessageSquare, Flag } from "lucide-react";

/*
|--------------------------------------------------------------------------
| Priority Config
|--------------------------------------------------------------------------
*/
const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
    dot: "bg-slate-400",
  },
  medium: {
    label: "Medium",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-600/10 border-indigo-600/20",
    dot: "bg-indigo-500",
  },
  high: {
    label: "High",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-600/15 border-amber-600/30",
    dot: "bg-amber-500",
  },
  critical: {
    label: "Critical",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-600/15 border-rose-600/30",
    dot: "bg-rose-500 animate-pulse",
  },
};

const STATUS_COLOR = {
  todo: "text-slate-500 dark:text-slate-400",
  in_progress: "text-indigo-500 dark:text-indigo-400",
  in_review: "text-purple-500 dark:text-purple-400",
  done: "text-emerald-500 dark:text-emerald-400",
  cancelled: "text-rose-500 dark:text-rose-400",
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
};

/*
|--------------------------------------------------------------------------
| TaskCard Component
|--------------------------------------------------------------------------
|*/
const TaskCard = ({ task, onClick, dragDisabledReason = "" }) => {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const due = formatDate(task.dueDate);
  const overdue = isOverdue(task.dueDate);
  const commentCount = task.comments?.length || 0;
  const assigneeName = task.assigneeId?.name;
  const assigneeInitials = assigneeName
    ? assigneeName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : null;

  return (
    <div
      onClick={() => onClick && onClick(task)}
      className="group p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all duration-200 space-y-3 select-none"
    >
      {/* Priority + Status Row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${priority.bg} ${priority.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>
        <span className={`text-[9px] font-bold ${STATUS_COLOR[task.status] || "text-muted-foreground"} uppercase tracking-wider`}>
          {task.status?.replace("_", " ")}
        </span>
      </div>

      {/* Title */}
      <p className="text-xs font-bold leading-snug text-foreground/90 group-hover:text-primary transition-colors line-clamp-2">
        {task.title}
      </p>

      {/* Footer Row */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border/40">
        {/* Due date */}
        <div className="flex items-center gap-2">
          {due && (
            <span
              className={`flex items-center gap-1 text-[9px] font-bold ${
                overdue ? "text-rose-500" : "text-muted-foreground/80"
              }`}
            >
              <Calendar className="w-3 h-3 text-muted-foreground/60" />
              {due}
              {overdue && <AlertCircle className="w-3 h-3 text-rose-500 flex-shrink-0" />}
            </span>
          )}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/80">
              <MessageSquare className="w-3 h-3 text-muted-foreground/60" />
              {commentCount}
            </span>
          )}
        </div>

        {/* Assignee avatar */}
        {assigneeInitials ? (
          <div
            title={assigneeName}
            className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 flex items-center justify-center text-[9px] font-extrabold text-primary flex-shrink-0"
          >
            {assigneeInitials}
          </div>
        ) : (
          <div
            title="Unassigned"
            className="w-6.5 h-6.5 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0"
          >
            <User className="w-3 h-3 text-muted-foreground/60" />
          </div>
        )}
      </div>

      {dragDisabledReason && (
        <div className="rounded-lg border border-border/70 bg-secondary/40 px-2 py-1 text-[9px] font-medium text-muted-foreground">
          {dragDisabledReason}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
