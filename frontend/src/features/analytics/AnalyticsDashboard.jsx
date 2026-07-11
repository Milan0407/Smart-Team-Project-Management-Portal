import { useParams } from "react-router-dom";
import { useGetOrgStatsQuery } from "./analyticsApiSlice";
import {
  BarChart2,
  Folder,
  Users,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Printer,
  RefreshCw,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Mini horizontal bar — pure CSS
|--------------------------------------------------------------------------
*/
const HBar = ({ label, value, max, color = "bg-primary" }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-8 text-right">{value}</span>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Progress ring — pure SVG
|--------------------------------------------------------------------------
*/
const ProgressRing = ({ percent, size = 80, strokeWidth = 8, color = "#6366f1" }) => {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={cx} cy={cx} r={r} fill="none"
        className="stroke-secondary" strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={progress}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
};

const getErrorMessage = (error) =>
  error?.data?.message || error?.message || "Analytics data could not be loaded.";

const AnalyticsSkeleton = () => (
  <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
    <div className="border-b border-border/40 pb-4">
      <div className="h-8 w-64 rounded bg-secondary" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-secondary" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="rounded-xl border border-border bg-card p-5">
          <div className="h-10 w-10 rounded-lg bg-secondary" />
          <div className="mt-4 h-7 w-12 rounded bg-secondary" />
          <div className="mt-3 h-3 w-24 rounded bg-secondary" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-64 rounded-xl border border-border bg-card p-6">
          <div className="h-3 w-36 rounded bg-secondary" />
          <div className="mt-8 h-32 rounded bg-secondary" />
        </div>
      ))}
    </div>
  </div>
);

const AnalyticsError = ({ error, onRetry }) => (
  <div className="max-w-3xl mx-auto rounded-lg border border-border bg-card p-8 text-center shadow-sm">
    <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
    <h3 className="mt-4 text-lg font-semibold text-foreground">Unable to load analytics</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{getErrorMessage(error)}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <RefreshCw className="h-4 w-4" />
      Retry
    </button>
  </div>
);

/*
|--------------------------------------------------------------------------
| KpiCard
|--------------------------------------------------------------------------
*/
const KpiCard = ({ icon: Icon, label, value, sub, iconColor, iconBg }) => (
  <div className="p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all space-y-3">
    <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <div className="text-2xl font-semibold tracking-tight">{value ?? "-"}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground/70 mt-1">{sub}</div>}
    </div>
  </div>
);

/*
|--------------------------------------------------------------------------
| STATUS_COLORS
|--------------------------------------------------------------------------
*/
const STATUS_COLORS = {
  todo:        { label: "To Do",       bar: "bg-slate-400",  hex: "#94a3b8" },
  in_progress: { label: "In Progress", bar: "bg-amber-400",  hex: "#fbbf24" },
  in_review:   { label: "In Review",   bar: "bg-violet-400", hex: "#a78bfa" },
  done:        { label: "Done",        bar: "bg-emerald-500",hex: "#10b981" },
  cancelled:   { label: "Cancelled",   bar: "bg-rose-400",   hex: "#f87171" },
};

/*
|--------------------------------------------------------------------------
| AnalyticsDashboard
|--------------------------------------------------------------------------
*/
const AnalyticsDashboard = () => {
  const { orgId } = useParams();
  const { data: statsRes, isLoading, isError, error, refetch } = useGetOrgStatsQuery(orgId, { skip: !orgId });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (isError) {
    return <AnalyticsError error={error} onRetry={refetch} />;
  }

  const stats = statsRes?.data;
  if (!stats) {
    return (
      <div className="max-w-3xl mx-auto rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <BarChart2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">No analytics available yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Analytics will appear once projects and tasks have activity to summarize.
        </p>
      </div>
    );
  }

  const { projects, members, tasks } = stats;
  const memberTotal = typeof members === "number" ? members : members?.total || 0;
  const maxTaskByStatus = Math.max(...Object.values(tasks.byStatus || {}), 1);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      <style>{`
        @media print {
          /* Hide navigation sidebar, top headers, utility widgets, bells and buttons */
          aside,
          header,
          button,
          .no-print,
          nav {
            display: none !important;
          }
          
          /* Force page flow and visible overflows */
          body, html, #root {
            background: #ffffff !important;
            color: #000000 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          main, 
          .flex-1,
          .overflow-y-auto {
            margin: 0 !important;
            padding: 1cm !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
          }
          
          /* Maintain premium grid structure on paper */
          .grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1.5rem !important;
          }
          
          .lg\\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          
          .lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          
          .sm\\:grid-cols-3 {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          
          /* Borders and backgrounds for print clarity */
          .bg-card {
            background: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
          }
          
          /* Prevent animations or clipping */
          .animate-fadeIn,
          .transition-all {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Page header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center no-print">
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organisation-wide insights · real-time aggregations
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-secondary rounded-lg text-xs font-semibold transition-all text-muted-foreground no-print"
          title="Print or export dashboard as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / PDF
        </button>
      </div>

      {/* ── Tier 1 KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Folder}
          label="Total Projects"
          value={projects.total}
          sub={`${projects.active ?? 0} active · ${projects.completed ?? 0} completed`}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <KpiCard
          icon={Users}
          label="Org Members"
          value={memberTotal}
          iconColor="text-violet-500"
          iconBg="bg-violet-500/10"
        />
        <KpiCard
          icon={CheckSquare}
          label="Total Tasks"
          value={tasks.total}
          sub={`${tasks.byStatus?.done ?? 0} done`}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Overdue Tasks"
          value={tasks.overdue}
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Completion Rate ring ─────────────────────────────────── */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm flex flex-col items-center justify-center gap-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider self-start">
            Completion Rate
          </h3>
          <div className="relative">
            <ProgressRing percent={tasks.completionRate} size={120} strokeWidth={12} color="#6366f1" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold">{tasks.completionRate}%</span>
              <span className="text-[10px] text-muted-foreground">complete</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {tasks.byStatus?.done ?? 0} of {tasks.total} tasks done
          </div>
        </div>

        {/* ── Project Status breakdown ─────────────────────────────── */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projects by Status
          </h3>
          <div className="space-y-3">
            {[
              { label: "Active", value: projects.active ?? 0, color: "bg-emerald-500" },
              { label: "Completed", value: projects.completed ?? 0, color: "bg-primary" },
              { label: "Archived", value: projects.archived ?? 0, color: "bg-slate-400" },
            ].map((row) => (
              <HBar key={row.label} {...row} max={projects.total || 1} />
            ))}
          </div>
          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            {projects.total} project{projects.total !== 1 ? "s" : ""} total
          </div>
        </div>

        {/* ── Task Status breakdown ─────────────────────────────────── */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tasks by Status
          </h3>
          <div className="space-y-3">
            {Object.entries(STATUS_COLORS).map(([key, meta]) => {
              const count = tasks.byStatus?.[key] || 0;
              return (
                <HBar
                  key={key}
                  label={meta.label}
                  value={count}
                  max={maxTaskByStatus}
                  color={meta.bar}
                />
              );
            })}
          </div>
          <div className="pt-2 border-t border-border text-xs text-muted-foreground">
            {tasks.overdue > 0 && (
              <span className="text-destructive font-medium">
                ⚠ {tasks.overdue} task{tasks.overdue !== 1 ? "s" : ""} overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: TrendingUp,
            label: "Org Health Score",
            value: `${Math.max(0, tasks.completionRate - tasks.overdue)}%`,
            desc: "Based on completion rate minus overdue penalty",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            icon: Clock,
            label: "Avg Tasks per Member",
            value: memberTotal > 0 ? (tasks.total / memberTotal).toFixed(1) : "0",
            desc: "Across all active org members",
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            icon: CheckSquare,
            label: "Tasks per Project",
            value: projects.total > 0 ? (tasks.total / projects.total).toFixed(1) : "0",
            desc: "Average across active projects",
            color: "text-violet-500",
            bg: "bg-violet-500/10",
          },
        ].map(({ icon: Icon, label, value, desc, color, bg }) => (
          <div key={label} className="p-5 rounded-xl border border-border bg-card shadow-sm flex gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <div className={`text-xl font-semibold ${color}`}>{value}</div>
              <div className="text-xs font-medium mt-0.5">{label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
