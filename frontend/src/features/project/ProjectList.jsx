import { useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import {
  useGetProjectsByOrgQuery,
  useCreateProjectMutation,
} from "./projectApiSlice";
import { useGetOrgMembersQuery } from "../org/orgApiSlice";
import { Folder, Plus, ChevronRight, User, AlertCircle, Key, RefreshCw } from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || fallback;

const ListSkeleton = () => (
  <>
    {[1, 2].map((item) => (
      <div key={item} className="p-6 rounded-xl border border-border bg-card shadow-sm animate-pulse">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-40 rounded bg-secondary" />
          <div className="h-6 w-16 rounded bg-secondary" />
        </div>
        <div className="mt-5 h-3 w-full rounded bg-secondary" />
        <div className="mt-2 h-3 w-2/3 rounded bg-secondary" />
        <div className="mt-6 h-px bg-border" />
        <div className="mt-4 h-4 w-32 rounded bg-secondary" />
      </div>
    ))}
  </>
);

const ErrorState = ({ title, message, onRetry }) => (
  <div className="col-span-full rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
    <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
    <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    )}
  </div>
);

const ProjectList = () => {
  const { orgId } = useParams();
  const { userProfile } = useOutletContext();
  const orgs = userProfile?.data?.orgMemberships || [];
  const activeOrgMember = orgs.find((o) => o.orgId?._id === orgId);
  const userRole = activeOrgMember?.role;
  const isAdmin = userRole === "org_admin";

  const {
    data: projectsRes,
    isLoading: projectsLoading,
    isError: projectsIsError,
    error: projectsError,
    refetch: refetchProjects,
  } = useGetProjectsByOrgQuery(orgId);
  const {
    data: membersRes,
    isLoading: membersLoading,
    isError: membersIsError,
    error: membersError,
    refetch: refetchMembers,
  } = useGetOrgMembersQuery(orgId);
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState("");
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const projects = projectsRes?.data || [];
  const members = membersRes?.data?.members || [];

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    
    // Auto-generate project key from first letters of name
    const generatedKey = val
      .toUpperCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0))
      .join("")
      .replace(/[^A-Z]/g, "")
      .substring(0, 5); // Limit length to 5 chars
    
    setKey(generatedKey);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!leadId) {
      setError("Please select a Project Lead");
      return;
    }

    if (key.length < 2) {
      setError("Project key must be at least 2 characters");
      return;
    }

    try {
      const res = await createProject({
        orgId,
        name,
        key,
        description,
        leadId,
      }).unwrap();

      if (res.success) {
        setName("");
        setKey("");
        setDescription("");
        setLeadId("");
        setShowCreateForm(false);
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to create project");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Projects</h2>
          <p className="text-sm text-muted-foreground">
            Plan, monitor, and coordinate workspaces with structured enterprise projects.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 max-w-xl animate-slideDown">
          <h3 className="font-semibold text-sm flex items-center gap-2 border-b border-border pb-2">
            <Folder className="w-4 h-4 text-primary" />
            New Project Details
          </h3>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {membersIsError && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs flex items-start justify-between gap-3">
              <span>{getErrorMessage(membersError, "Project leads could not be loaded.")}</span>
              <button type="button" onClick={refetchMembers} className="font-semibold text-primary hover:underline">
                Retry
              </button>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Marketing Portal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  Project Key (unique identifier)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  required
                  minLength={2}
                  maxLength={10}
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-semibold"
                  placeholder="MP"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Assigned Project Lead
                </label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  disabled={membersLoading || membersIsError}
                  className="w-full p-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all font-medium"
                >
                  <option value="">
                    {membersLoading
                      ? "Loading members..."
                      : membersIsError
                        ? "Members unavailable"
                        : "-- Select Project Lead --"}
                  </option>
                  {members.map((m) => (
                    <option key={m.userId?._id} value={m.userId?._id}>
                      {m.userId?.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Project specifications and timeline..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {isCreating ? "Creating..." : "Save Project"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-border hover:bg-secondary text-xs rounded-lg transition-all text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projectsLoading && (
          <ListSkeleton />
        )}

        {!projectsLoading && projectsIsError && (
          <ErrorState
            title="Projects failed to load"
            message={getErrorMessage(projectsError, "We could not load projects for this workspace.")}
            onRetry={refetchProjects}
          />
        )}

        {!projectsLoading && !projectsIsError && projects.length === 0 && (
          <div className="col-span-2 text-center py-20 border border-dashed rounded-xl bg-card">
            <Folder className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">No Projects Created</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Click the "Create Project" button above to launch your first team project.
            </p>
          </div>
        )}

        {projects.map((proj) => {
          return (
            <div
              key={proj._id}
              className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    {proj.name}
                  </h3>
                  <span className="text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-primary font-bold">
                    {proj.key}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {proj.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Lead: </span>
                    <span className="font-semibold text-foreground">{proj.leadId?.name || "N/A"}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {proj.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                <Link
                  to={`/orgs/${orgId}/projects/${proj._id}`}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  View details & boards
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectList;
