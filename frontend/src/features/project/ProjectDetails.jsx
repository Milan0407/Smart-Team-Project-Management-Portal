import { useState } from "react";
import { useParams, useNavigate, Link, useOutletContext } from "react-router-dom";
import {
  useGetProjectQuery,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useUpdateProjectMemberRoleMutation,
  useRemoveProjectMemberMutation,
} from "./projectApiSlice";
import { useGetOrgMembersQuery } from "../org/orgApiSlice";
import {
  useGetBoardsByProjectQuery,
  useCreateBoardMutation,
} from "../board/boardApiSlice";
import ChatPanel from "../chat/ChatPanel";
import ProjectAnalytics from "../analytics/ProjectAnalytics";
import { Folder, ArrowLeft, Plus, Trash2, LayoutDashboard, ChevronRight, AlertCircle, CheckCircle, Users, UserPlus, ShieldCheck, Eye, Code2, RefreshCw, Info } from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || fallback;

const DetailSkeleton = () => (
  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 h-full overflow-hidden">
    <div className="min-w-0 space-y-8 overflow-hidden pr-1 animate-pulse">
      <div className="h-5 w-36 rounded bg-secondary" />
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-7 w-72 max-w-full rounded bg-secondary" />
        <div className="mt-5 h-4 w-full rounded bg-secondary" />
        <div className="mt-3 h-4 w-2/3 rounded bg-secondary" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-6 w-44 rounded bg-secondary" />
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="h-28 rounded-lg bg-secondary" />
          <div className="h-28 rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
    <div className="hidden xl:block rounded-xl border border-border bg-card/60 animate-pulse" />
  </div>
);

const ErrorState = ({ title, message, onRetry, backTo, backLabel }) => (
  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
    <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
    <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
        >
          {backLabel}
        </Link>
      )}
    </div>
  </div>
);

const ROLE_META = {
  project_manager: {
    label: "Project Manager",
    description: "Can manage boards, tasks, and members.",
    icon: ShieldCheck,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  developer: {
    label: "Developer",
    description: "Can create and update project work.",
    icon: Code2,
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  viewer: {
    label: "Viewer",
    description: "Can inspect project activity without editing.",
    icon: Eye,
    className: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "U";

const ProjectDetails = () => {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useOutletContext();
  
  const orgs = userProfile?.data?.orgMemberships || [];
  const activeOrgMember = orgs.find((o) => o.orgId?._id === orgId);
  const userRole = activeOrgMember?.role;
  const isAdmin = userRole === "org_admin";

  // Load queries
  const {
    data: projectRes,
    isLoading: projectLoading,
    isError: projectIsError,
    error: projectError,
    refetch: refetchProject,
  } = useGetProjectQuery(projectId);
  const {
    data: boardsRes,
    isLoading: boardsLoading,
    isError: boardsIsError,
    error: boardsError,
    refetch: refetchBoards,
  } = useGetBoardsByProjectQuery(projectId);
  const {
    data: projectMembersRes,
    isLoading: projectMembersLoading,
    isError: projectMembersIsError,
    error: projectMembersError,
    refetch: refetchProjectMembers,
  } = useGetProjectMembersQuery(projectId);
  const {
    data: orgMembersRes,
    isLoading: orgMembersLoading,
    isError: orgMembersIsError,
    error: orgMembersError,
    refetch: refetchOrgMembers,
  } = useGetOrgMembersQuery(orgId);

  const [createBoard, { isLoading: isCreatingBoard }] = useCreateBoardMutation();
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [addProjectMember, { isLoading: isAddingMember }] = useAddProjectMemberMutation();
  const [updateProjectMemberRole] = useUpdateProjectMemberRoleMutation();
  const [removeProjectMember] = useRemoveProjectMemberMutation();

  const [boardName, setBoardName] = useState("");
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState("developer");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const project = projectRes?.data;
  const boards = boardsRes?.data || [];
  const projectMembers = projectMembersRes?.data || project?.members || [];
  const orgMembers = orgMembersRes?.data?.members || [];
  
  const isLead = project?.leadId === userProfile?.data?._id || (project?.leadId?._id && project?.leadId?._id === userProfile?.data?._id);
  const currentProjectMember = projectMembers.find((member) => {
    const memberId = member.userId?._id || member.userId;
    return memberId === userProfile?.data?._id;
  });
  const isProjectManager = isAdmin || isLead || currentProjectMember?.role === "project_manager";
  const projectMemberIds = new Set(projectMembers.map((member) => member.userId?._id || member.userId));
  const availableOrgMembers = orgMembers.filter((member) => {
    const userId = member.userId?._id || member.userId;
    return userId && !projectMemberIds.has(userId);
  });
  const memberDataLoading = projectMembersLoading || orgMembersLoading;
  const memberDataError = projectMembersIsError || orgMembersIsError;
  const noAvailableOrgMembers = !memberDataLoading && !memberDataError && availableOrgMembers.length === 0;
  const addMemberDisabled = memberDataLoading || memberDataError || noAvailableOrgMembers || isAddingMember || !memberUserId;
  const projectRoles = ["project_manager", "developer", "viewer"];
  const leadId = project?.leadId?._id || project?.leadId;
  const memberRoleCounts = projectMembers.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {});

  const handleCreateBoardSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await createBoard({
        projectId,
        name: boardName,
      }).unwrap();

      if (res.success) {
        setSuccess("Board created successfully.");
        setBoardName("");
        setShowBoardForm(false);
        refetchBoards();
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to create board");
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to deactivate (delete) this project?")) {
      return;
    }
    setError(null);

    try {
      const res = await deleteProject(projectId).unwrap();
      if (res.success) {
        navigate(`/orgs/${orgId}/projects`);
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to delete project");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberUserId) return;
    setError(null);
    setSuccess(null);

    try {
      await addProjectMember({
        id: projectId,
        userId: memberUserId,
        role: memberRole,
      }).unwrap();
      setSuccess("Project member added successfully.");
      setMemberUserId("");
      setMemberRole("developer");
    } catch (err) {
      setError(err?.data?.message || "Failed to add project member");
    }
  };

  const handleUpdateMemberRole = async (uid, role) => {
    setError(null);
    setSuccess(null);

    try {
      await updateProjectMemberRole({
        id: projectId,
        uid,
        role,
      }).unwrap();
      setSuccess("Project member role updated.");
    } catch (err) {
      setError(err?.data?.message || "Failed to update project member role");
    }
  };

  const handleRemoveMember = async (uid) => {
    if (!confirm("Remove this user from the project?")) return;
    setError(null);
    setSuccess(null);

    try {
      await removeProjectMember({
        id: projectId,
        uid,
      }).unwrap();
      setSuccess("Project member removed.");
    } catch (err) {
      setError(err?.data?.message || "Failed to remove project member");
    }
  };

  if (projectLoading) {
    return <DetailSkeleton />;
  }

  if (projectIsError) {
    return (
      <ErrorState
        title="Project failed to load"
        message={getErrorMessage(projectError, "We could not load this project.")}
        onRetry={refetchProject}
        backTo={`/orgs/${orgId}/projects`}
        backLabel="Back to Projects"
      />
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 border border-dashed rounded-xl bg-card">
        <h3 className="font-bold text-lg text-destructive">Project Not Found</h3>
        <p className="text-xs text-muted-foreground mt-2">
          Verify the project ID or navigate back to the projects list.
        </p>
        <Link to={`/orgs/${orgId}/projects`} className="text-xs text-primary underline mt-4 block">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 h-full overflow-hidden animate-fadeIn">
      {/* ── Main Content (left) ── */}
      <div className="min-w-0 space-y-8 overflow-y-auto overflow-x-hidden pr-1">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <Link
            to={`/orgs/${orgId}/projects`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </Link>
          {isProjectManager && (
            <button
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Deactivate Project
            </button>
          )}
        </div>

        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Main Info */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
            <h2 className="text-xl font-bold flex items-center gap-2 min-w-0">
              <Folder className="w-6 h-6 text-primary" />
              <span className="truncate">{project.name}</span>
            </h2>
            <span className="text-xs bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded text-primary font-bold w-fit">
              Key: {project.key}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {project.description || "No description provided for this project."}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground border-t border-border pt-4">
            <span className="font-semibold">Project Lead: </span>
            <span className="text-foreground break-all">{project.leadId?.name || "N/A"} ({project.leadId?.email})</span>
            <span>•</span>
            <span className="font-semibold">Status: </span>
            <span className="capitalize text-emerald-500 font-bold">{project.status}</span>
          </div>
        </div>

        {/* Project Analytics Widget */}
        <ProjectAnalytics projectId={projectId} />

        {/* Project Members Section */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Project Members
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1">
                Control who can manage, contribute to, or view this project.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {projectRoles.map((role) => {
                const meta = ROLE_META[role];
                const Icon = meta.icon;

                return (
                  <span
                    key={role}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${meta.className}`}
                    title={meta.description}
                  >
                    <Icon className="w-3 h-3" />
                    {memberRoleCounts[role] || 0} {meta.label}
                  </span>
                );
              })}
            </div>
          </div>

          {isProjectManager && (
            <form onSubmit={handleAddMember} className="rounded-xl border border-border/80 bg-secondary/15 p-3">
              {(projectMembersIsError || orgMembersIsError) && (
                <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 flex items-start justify-between gap-3">
                  <span>
                    {getErrorMessage(projectMembersError || orgMembersError, "Member data could not be loaded.")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (projectMembersIsError) refetchProjectMembers();
                      if (orgMembersIsError) refetchOrgMembers();
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}
              {noAvailableOrgMembers && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    Every organization member is already on this project. Add or invite another user to the organization first, then return here to add them to this project.
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_160px_120px] gap-2">
                <select
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  disabled={memberDataLoading || memberDataError || noAvailableOrgMembers}
                  className="min-w-0 w-full px-3 py-2 rounded-lg bg-card border border-border text-xs outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value="">
                    {memberDataLoading
                      ? "Loading members..."
                      : memberDataError
                        ? "Members unavailable"
                        : noAvailableOrgMembers
                          ? "No organization members available to add"
                          : "Select an organization member"}
                  </option>
                  {availableOrgMembers.map((member) => (
                    <option key={member.userId?._id} value={member.userId?._id}>
                      {member.userId?.name} ({member.userId?.email})
                    </option>
                  ))}
                </select>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  disabled={memberDataLoading || memberDataError || noAvailableOrgMembers}
                  className="min-w-0 w-full px-3 py-2 rounded-lg bg-card border border-border text-xs outline-none focus:border-primary disabled:opacity-60"
                >
                  {projectRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_META[role].label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={addMemberDisabled}
                  className="min-w-0 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
            {projectMembers.map((member) => {
              const user = member.userId;
              const uid = user?._id || user;
              const isProjectLead = leadId === uid;
              const meta = ROLE_META[member.role] || ROLE_META.developer;
              const Icon = meta.icon;

              return (
                <div key={uid} className="min-w-0 p-4 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/20 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-extrabold flex-shrink-0">
                          {getInitials(user?.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">{user?.name || "Unknown user"}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                      </div>
                    </div>
                    {isProjectLead && (
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0">
                        Lead
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {isProjectManager ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(uid, e.target.value)}
                        disabled={isProjectLead}
                        title={isProjectLead ? "Project lead must remain a manager" : meta.description}
                        className="min-w-0 flex-1 bg-card border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-60"
                      >
                        {projectRoles.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_META[role].label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${meta.className}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    )}

                    {isProjectManager && !isProjectLead && (
                      <button
                        onClick={() => handleRemoveMember(uid)}
                        className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kanban / Scrum Boards Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-border pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              Project Boards
            </h3>
            {isProjectManager && (
              <button
                onClick={() => setShowBoardForm(!showBoardForm)}
                className="flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary-hover border border-border text-xs rounded-lg font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Board
              </button>
            )}
          </div>

          {showBoardForm && (
            <form onSubmit={handleCreateBoardSubmit} className="p-4 border border-border rounded-xl bg-card max-w-sm space-y-3 animate-slideDown">
              <label className="block text-xs font-semibold text-muted-foreground">Board Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs outline-none focus:border-primary transition-all"
                  placeholder="Sprint 1 Board"
                />
                <button
                  type="submit"
                  disabled={isCreatingBoard}
                  className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {boardsLoading && (
              <>
                <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
                <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
              </>
            )}

            {!boardsLoading && boardsIsError && (
              <div className="col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                <h4 className="mt-3 text-sm font-semibold">Boards failed to load</h4>
                <p className="mt-1 text-xs text-muted-foreground">{getErrorMessage(boardsError)}</p>
                <button
                  type="button"
                  onClick={refetchBoards}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            )}

            {!boardsLoading && !boardsIsError && boards.length === 0 && (
              <div className="col-span-2 text-center py-10 border border-dashed rounded-xl bg-card">
                <LayoutDashboard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <div className="text-xs font-medium text-muted-foreground">No boards established.</div>
              </div>
            )}

            {boards.map((board) => (
              <div
                key={board._id}
                className="min-w-0 p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <h4 className="font-bold text-sm flex items-center gap-2 min-w-0">
                    <LayoutDashboard className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">{board.name}</span>
                  </h4>
                  <div className="text-[10px] text-muted-foreground truncate">
                    Columns: {board.columns?.map((c) => c.name).join(" → ")}
                  </div>
                </div>

                <Link
                  to={`/orgs/${orgId}/projects/${projectId}/boards/${board._id}`}
                  className="flex items-center gap-0.5 text-xs text-primary font-semibold hover:underline flex-shrink-0"
                >
                  Open
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Chat Panel (right sidebar) ── */}
      <div className="min-w-0 border border-border rounded-xl bg-card/60 overflow-hidden flex flex-col h-fit max-h-[calc(100vh-8rem)] sticky top-0">
        <ChatPanel projectId={projectId} projectName={project?.name} />
      </div>
    </div>
  );
};

export default ProjectDetails;
