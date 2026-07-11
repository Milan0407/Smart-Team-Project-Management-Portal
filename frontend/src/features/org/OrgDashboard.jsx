import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  ChevronRight,
  CircleDot,
  Folder,
  Landmark,
  Layers,
  Network,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useGetOrgQuery, useGetOrgMembersQuery, useGetOrgActivityQuery } from "./orgApiSlice";
import { useGetDepartmentsByOrgQuery } from "../department/deptApiSlice";
import { useGetTeamsByOrgQuery } from "../team/teamApiSlice";
import { useGetProjectsByOrgQuery } from "../project/projectApiSlice";
import { useGetOrgStatsQuery } from "../analytics/analyticsApiSlice";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

const formatRole = (role = "") =>
  role
    .replace(/^org_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatActivityTime = (value) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getActivityLabel = (activity) => {
  const action = activity?.action?.replace(/_/g, " ") || "updated";
  const taskTitle = activity?.taskId?.title || "a task";
  return `${action.charAt(0).toUpperCase()}${action.slice(1)} ${taskTitle}`;
};

const getErrorMessage = (error, fallback = "Something went wrong while loading this section.") =>
  error?.data?.message || error?.message || fallback;

const LoadingBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg border border-border bg-card p-4 ${className}`}>
    <div className="h-3 w-24 rounded bg-secondary" />
    <div className="mt-4 h-7 w-14 rounded bg-secondary" />
    <div className="mt-4 h-3 w-36 rounded bg-secondary" />
  </div>
);

const ErrorNotice = ({ title = "Unable to load data", message, onRetry, compact = false }) => (
  <div
    className={`rounded-lg border border-destructive/20 bg-destructive/5 ${
      compact ? "px-3 py-2" : "p-4"
    }`}
  >
    <div className="flex items-start gap-3">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex flex-shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  </div>
);

const EmptyPreview = ({ icon: Icon, title, actionLabel, to }) => (
  <div className="rounded-lg border border-dashed border-border bg-secondary/25 px-4 py-8 text-center">
    <Icon className="mx-auto h-8 w-8 text-muted-foreground/40" />
    <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
    {to && (
      <Link
        to={to}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-secondary"
      >
        <Plus className="h-3.5 w-3.5" />
        {actionLabel}
      </Link>
    )}
  </div>
);

const StatCard = ({ icon: Icon, label, value, detail, tone }) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      </div>
      <div className={`rounded-lg border p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
  </div>
);

const PreviewPanel = ({ title, icon: Icon, to, actionLabel, children }) => (
  <section className="rounded-lg border border-border bg-card shadow-sm">
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
        <h3 className="truncate text-sm font-semibold">{title}</h3>
      </div>
      <Link
        to={to}
        className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        {actionLabel}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
    <div className="space-y-2 p-4">{children}</div>
  </section>
);

const OrgDashboard = () => {
  const { orgId } = useParams();

  const {
    data: orgRes,
    isLoading: orgLoading,
    isError: orgIsError,
    error: orgError,
    refetch: refetchOrg,
  } = useGetOrgQuery(orgId);
  const {
    data: membersRes,
    isLoading: membersLoading,
    isError: membersIsError,
    error: membersError,
    refetch: refetchMembers,
  } = useGetOrgMembersQuery(orgId);
  const {
    data: deptsRes,
    isLoading: deptsLoading,
    isError: deptsIsError,
    error: deptsError,
    refetch: refetchDepartments,
  } = useGetDepartmentsByOrgQuery(orgId);
  const {
    data: teamsRes,
    isLoading: teamsLoading,
    isError: teamsIsError,
    error: teamsError,
    refetch: refetchTeams,
  } = useGetTeamsByOrgQuery(orgId);
  const {
    data: projectsRes,
    isLoading: projectsLoading,
    isError: projectsIsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsByOrgQuery(orgId);
  const {
    data: activityRes,
    isLoading: activityLoading,
    isError: activityIsError,
    error: activityError,
    refetch: refetchActivity,
  } = useGetOrgActivityQuery(orgId);
  const {
    data: statsRes,
    isLoading: statsLoading,
    isError: statsIsError,
    error: statsError,
    refetch: refetchStats,
  } = useGetOrgStatsQuery(orgId);

  const org = orgRes?.data;
  const stats = statsRes?.data;
  const members = membersRes?.data?.members || [];
  const departments = deptsRes?.data || [];
  const teams = teamsRes?.data || [];
  const projects = projectsRes?.data || [];
  const activities = activityRes?.data || [];

  const isLoading =
    orgLoading ||
    membersLoading ||
    deptsLoading ||
    teamsLoading ||
    projectsLoading ||
    activityLoading ||
    statsLoading;

  const fallbackRoleCounts = useMemo(
    () =>
      members.reduce((counts, member) => {
        const role = member.role || "member";
        counts[role] = (counts[role] || 0) + 1;
        return counts;
      }, {}),
    [members]
  );
  const activeProjects =
    stats?.projects?.active ?? projects.filter((project) => project.status !== "archived").length;
  const projectCount = stats?.projects?.total ?? projects.length;
  const memberCount = stats?.members?.total ?? members.length;
  const memberRoleCounts = stats?.members?.byRole || fallbackRoleCounts;
  const departmentCount = stats?.departments?.total ?? departments.length;
  const teamCount = stats?.teams?.total ?? teams.length;
  const taskStats = stats?.tasks || {};
  const taskCount = taskStats.total ?? 0;
  const overdueTasks = taskStats.overdue ?? 0;
  const completionRate = taskStats.completionRate ?? 0;

  if (orgLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="animate-pulse rounded-lg border border-border bg-card p-6">
          <div className="h-4 w-40 rounded bg-secondary" />
          <div className="mt-5 h-8 w-72 max-w-full rounded bg-secondary" />
          <div className="mt-4 h-4 w-full max-w-xl rounded bg-secondary" />
          <div className="mt-6 flex gap-2">
            <div className="h-9 w-28 rounded-lg bg-secondary" />
            <div className="h-9 w-28 rounded-lg bg-secondary" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <LoadingBlock key={item} />)}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <LoadingBlock className="h-80 xl:col-span-2" />
          <LoadingBlock className="h-80" />
        </div>
      </div>
    );
  }

  if (orgIsError) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">Unable to load dashboard</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {getErrorMessage(orgError, "The workspace could not be loaded. Please try again.")}
        </p>
        <button
          type="button"
          onClick={refetchOrg}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card py-20 text-center">
        <Building2 className="mx-auto h-10 w-10 text-destructive/60" />
        <h3 className="mt-4 text-lg font-bold text-destructive">Organization Not Found</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Verify the workspace ID or select another organization from the sidebar.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fadeIn">
      {(statsIsError || projectsIsError || membersIsError || deptsIsError || teamsIsError || activityIsError) && (
        <ErrorNotice
          title="Some dashboard data did not load"
          message="The page is showing everything available right now. Retry the failed sections if the numbers or previews look incomplete."
          onRetry={() => {
            if (statsIsError) refetchStats();
            if (projectsIsError) refetchProjects();
            if (membersIsError) refetchMembers();
            if (deptsIsError) refetchDepartments();
            if (teamsIsError) refetchTeams();
            if (activityIsError) refetchActivity();
          }}
        />
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {org.plan || "free"} workspace
              </span>
              <span className="rounded-lg border border-border bg-secondary/60 px-2.5 py-1 font-mono text-xs font-medium text-muted-foreground">
                {org.slug}
              </span>
            </div>
            <h2 className="mt-4 truncate text-2xl font-bold tracking-tight text-foreground">
              {org.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Workspace overview for projects, teams, departments, members, and recent delivery activity.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to={`/orgs/${orgId}/projects`}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Folder className="h-4 w-4" />
                Projects
              </Link>
              <Link
                to={`/orgs/${orgId}/settings`}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-xs font-semibold transition-colors hover:bg-secondary"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Workspace Health
                </p>
                <p className="mt-1 text-xl font-semibold">{isLoading ? "..." : "Ready"}</p>
              </div>
              <CalendarClock className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="font-semibold text-foreground">{activeProjects}</p>
                <p className="mt-1 text-muted-foreground">active projects</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="font-semibold text-foreground">{activities.length}</p>
                <p className="mt-1 text-muted-foreground">recent events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          [1, 2, 3, 4].map((item) => <LoadingBlock key={item} />)
        ) : (
          <>
            <StatCard
              icon={Folder}
              label="Projects"
              value={projectCount}
              detail={`${activeProjects} active in this workspace`}
              tone="border-indigo-500/20 bg-indigo-500/10 text-indigo-500"
            />
            <StatCard
              icon={Users}
              label="Members"
              value={memberCount}
              detail={`${memberRoleCounts.org_admin || 0} admins, ${memberRoleCounts.org_member || 0} members`}
              tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
            />
            <StatCard
              icon={Landmark}
              label="Departments"
              value={departmentCount}
              detail={`${teamCount} teams connected across departments`}
              tone="border-sky-500/20 bg-sky-500/10 text-sky-500"
            />
            <StatCard
              icon={Activity}
              label="Tasks"
              value={taskCount}
              detail={`${completionRate}% complete, ${overdueTasks} overdue`}
              tone="border-amber-500/20 bg-amber-500/10 text-amber-500"
            />
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-5 min-w-0">
          <PreviewPanel
            title="Projects"
            icon={Layers}
            to={`/orgs/${orgId}/projects`}
            actionLabel="View all"
          >
            {projectsLoading ? (
              <LoadingBlock className="h-32" />
            ) : projectsIsError ? (
              <ErrorNotice
                title="Projects failed to load"
                message={getErrorMessage(projectsError)}
                onRetry={refetchProjects}
                compact
              />
            ) : projects.length === 0 ? (
              <EmptyPreview
                icon={Folder}
                title="No projects yet"
                actionLabel="Create project"
                to={`/orgs/${orgId}/projects`}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {projects.slice(0, 4).map((project) => (
                  <Link
                    key={project._id}
                    to={`/orgs/${orgId}/projects/${project._id}`}
                    className="group min-w-0 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/30 hover:bg-secondary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <Folder className="h-4 w-4 flex-shrink-0 text-primary" />
                          <h4 className="truncate text-sm font-semibold">{project.name}</h4>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {project.description || "No description provided."}
                        </p>
                      </div>
                      <span className="flex-shrink-0 rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {project.key}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                      <span className="truncate text-muted-foreground">
                        Lead: <span className="font-medium text-foreground">{project.leadId?.name || "N/A"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </PreviewPanel>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <PreviewPanel
              title="Departments"
              icon={Landmark}
              to={`/orgs/${orgId}/departments`}
              actionLabel="View all"
            >
              {deptsLoading ? (
                <LoadingBlock className="h-28" />
              ) : deptsIsError ? (
                <ErrorNotice
                  title="Departments failed to load"
                  message={getErrorMessage(deptsError)}
                  onRetry={refetchDepartments}
                  compact
                />
              ) : departments.length === 0 ? (
                <EmptyPreview icon={Landmark} title="No departments defined" />
              ) : (
                departments.slice(0, 5).map((dept) => (
                  <div
                    key={dept._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.description || "Department"}</p>
                    </div>
                    <span className="flex-shrink-0 rounded border border-border bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                      {dept.members?.length || 0} members
                    </span>
                  </div>
                ))
              )}
            </PreviewPanel>

            <PreviewPanel
              title="Teams"
              icon={Network}
              to={`/orgs/${orgId}/teams`}
              actionLabel="View all"
            >
              {teamsLoading ? (
                <LoadingBlock className="h-28" />
              ) : teamsIsError ? (
                <ErrorNotice
                  title="Teams failed to load"
                  message={getErrorMessage(teamsError)}
                  onRetry={refetchTeams}
                  compact
                />
              ) : teams.length === 0 ? (
                <EmptyPreview icon={Network} title="No teams created" />
              ) : (
                teams.slice(0, 5).map((team) => (
                  <div
                    key={team._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: team.color || "#2563eb" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <CircleDot className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                  </div>
                ))
              )}
            </PreviewPanel>
          </div>
        </div>

        <aside className="space-y-5 min-w-0">
          <PreviewPanel
            title="Recent Activity"
            icon={Activity}
            to={`/orgs/${orgId}/activity`}
            actionLabel="Feed"
          >
            {activityLoading ? (
              <LoadingBlock className="h-32" />
            ) : activityIsError ? (
              <ErrorNotice
                title="Activity failed to load"
                message={getErrorMessage(activityError)}
                onRetry={refetchActivity}
                compact
              />
            ) : activities.length === 0 ? (
              <EmptyPreview icon={Activity} title="No recent task activity" />
            ) : (
              activities.slice(0, 6).map((item) => (
                <div key={item._id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(item.actorId?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{getActivityLabel(item)}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.actorId?.name || "Someone"} in {item.projectId?.name || "Project"}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                        {formatActivityTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </PreviewPanel>

          <PreviewPanel
            title="Members"
            icon={Users}
            to={`/orgs/${orgId}/settings`}
            actionLabel="Manage"
          >
            {membersLoading ? (
              <LoadingBlock className="h-32" />
            ) : membersIsError ? (
              <ErrorNotice
                title="Members failed to load"
                message={getErrorMessage(membersError)}
                onRetry={refetchMembers}
                compact
              />
            ) : members.length === 0 ? (
              <EmptyPreview icon={Users} title="No members found" />
            ) : (
              members.slice(0, 6).map((member) => {
                const user = member.userId;
                if (!user) return null;

                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-semibold text-primary">
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className="flex-shrink-0 rounded border border-border bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                      {formatRole(member.role)}
                    </span>
                  </div>
                );
              })
            )}
          </PreviewPanel>
        </aside>
      </div>
    </div>
  );
};

export default OrgDashboard;
