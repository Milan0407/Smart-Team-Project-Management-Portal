import { useGetProjectStatsQuery, useGetProjectWorkloadQuery } from "./analyticsApiSlice";
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Users, RefreshCw } from "lucide-react";

/*
|--------------------------------------------------------------------------
| Donut chart — pure SVG, no chart library
|--------------------------------------------------------------------------
*/
const DonutChart = ({ segments, size = 100 }) => {
  const r = 36;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = segments.filter((s) => s.value > 0);
  const total = slices.reduce((s, seg) => s + seg.value, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="12"
        className="stroke-secondary" />
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="12"
          className="stroke-border" />
      ) : (
        slices.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const slice = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              strokeWidth="12"
              stroke={seg.color}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return slice;
        })
      )}
    </svg>
  );
};

/*
|--------------------------------------------------------------------------
| Workload bar — CSS bar chart per member
|--------------------------------------------------------------------------
*/
const WorkloadBar = ({ member, max }) => {
  const pct = max > 0 ? Math.round((member.total / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
        {member.name?.substring(0, 2)?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium truncate">{member.name}</span>
          <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
            {member.done}/{member.total}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {member.overdue > 0 && (
        <span className="text-[9px] text-destructive font-semibold bg-destructive/10 px-1.5 py-0.5 rounded flex-shrink-0">
          {member.overdue} overdue
        </span>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| STATUS_META — colour mapping
|--------------------------------------------------------------------------
*/
const STATUS_META = {
  todo:        { label: "To Do",       color: "#6b7280" },
  in_progress: { label: "In Progress", color: "#f59e0b" },
  in_review:   { label: "In Review",   color: "#8b5cf6" },
  done:        { label: "Done",        color: "#10b981" },
  cancelled:   { label: "Cancelled",   color: "#ef4444" },
};

const getErrorMessage = (error) =>
  error?.data?.message || error?.message || "Project analytics could not be loaded.";

const ProjectAnalyticsSkeleton = () => (
  <div className="space-y-5 border-b border-border pb-6 mb-2 animate-pulse">
    <div className="h-5 w-40 rounded bg-secondary" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="rounded-xl border border-border bg-card p-3.5">
          <div className="h-8 w-8 rounded-lg bg-secondary" />
          <div className="mt-3 h-6 w-12 rounded bg-secondary" />
          <div className="mt-2 h-3 w-20 rounded bg-secondary" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="h-44 rounded-xl border border-border bg-card p-4" />
      <div className="h-44 rounded-xl border border-border bg-card p-4" />
    </div>
  </div>
);

const ProjectAnalyticsError = ({ error, onRetry }) => (
  <div className="mb-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Project analytics failed to load</p>
        <p className="mt-1 text-xs text-muted-foreground">{getErrorMessage(error)}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| ProjectAnalytics — embedded stats widget
|--------------------------------------------------------------------------
*/
const ProjectAnalytics = ({ projectId }) => {
  const {
    data: statsRes,
    isLoading: statsLoading,
    isError: statsIsError,
    error: statsError,
    refetch: refetchStats,
  } = useGetProjectStatsQuery(projectId, { skip: !projectId });
  const {
    data: workloadRes,
    isLoading: workloadLoading,
    isError: workloadIsError,
    error: workloadError,
    refetch: refetchWorkload,
  } = useGetProjectWorkloadQuery(projectId, { skip: !projectId });
  if (statsLoading || workloadLoading) {
    return <ProjectAnalyticsSkeleton />;
  }

  if (statsIsError || workloadIsError) {
    return (
      <ProjectAnalyticsError
        error={statsError || workloadError}
        onRetry={() => {
          if (statsIsError) refetchStats();
          if (workloadIsError) refetchWorkload();
        }}
      />
    );
  }

  const stats = statsRes?.data;
  const workload = workloadRes?.data || [];
  if (!stats) {
    return (
      <div className="mb-2 rounded-xl border border-dashed border-border bg-card p-5 text-center">
        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-foreground">No project analytics yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create tasks on this project to start seeing analytics.
        </p>
      </div>
    );
  }

  const { tasks } = stats;
  const maxTasks = workload.length > 0 ? Math.max(...workload.map((m) => m.total)) : 1;

  // Build donut chart segments from byStatus
  const donutSegments = Object.entries(STATUS_META).map(([key, meta]) => ({
    label: meta.label,
    value: tasks.byStatus?.[key] || 0,
    color: meta.color,
  }));

  return (
    <div className="space-y-5 border-b border-border pb-6 mb-2">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Project Analytics
      </h3>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: CheckCircle2,
            label: "Completion",
            value: `${tasks.completionRate}%`,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            icon: Clock,
            label: "Total Tasks",
            value: tasks.total,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            icon: AlertTriangle,
            label: "Overdue",
            value: tasks.overdue,
            color: "text-destructive",
            bg: "bg-destructive/10",
          },
          {
            icon: Clock,
            label: "Due This Week",
            value: tasks.dueThisWeek,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`p-3.5 rounded-xl border border-border bg-card shadow-sm`}>
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-xl font-semibold ${color}`}>{value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Status donut chart */}
        <div className="p-4 border border-border rounded-xl bg-card shadow-sm">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Tasks by Status
          </h4>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <DonutChart segments={donutSegments} size={100} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-semibold">{tasks.total}</span>
                <span className="text-[9px] text-muted-foreground">tasks</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              {donutSegments.filter((s) => s.value > 0).map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[11px] text-muted-foreground flex-1 truncate">{s.label}</span>
                  <span className="text-[11px] font-semibold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Member workload */}
        <div className="p-4 border border-border rounded-xl bg-card shadow-sm">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Member Workload
          </h4>
          {workload.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">
              No tasks assigned yet
            </div>
          ) : (
            <div className="space-y-3">
              {workload.slice(0, 5).map((member) => (
                <WorkloadBar key={member.userId} member={member} max={maxTasks} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;
