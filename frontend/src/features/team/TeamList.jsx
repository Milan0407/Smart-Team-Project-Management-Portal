import { useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import {
  useGetTeamsByOrgQuery,
  useCreateTeamMutation,
} from "./teamApiSlice";
import { useGetDepartmentsByOrgQuery } from "../department/deptApiSlice";
import { useGetOrgMembersQuery } from "../org/orgApiSlice";
import { Network, Plus, Users, ChevronRight, User, AlertCircle, Bookmark, RefreshCw } from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || fallback;

const ListSkeleton = () => (
  <>
    {[1, 2].map((item) => (
      <div key={item} className="p-6 rounded-xl border border-border bg-card shadow-sm animate-pulse">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-36 rounded bg-secondary" />
          <div className="h-6 w-20 rounded bg-secondary" />
        </div>
        <div className="mt-5 h-3 w-full rounded bg-secondary" />
        <div className="mt-2 h-3 w-2/3 rounded bg-secondary" />
        <div className="mt-6 h-px bg-border" />
        <div className="mt-4 h-4 w-44 rounded bg-secondary" />
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

const TeamList = () => {
  const { orgId } = useParams();
  const { userProfile } = useOutletContext();
  const orgs = userProfile?.data?.orgMemberships || [];
  const activeOrgMember = orgs.find((o) => o.orgId?._id === orgId);
  const userRole = activeOrgMember?.role;
  const isAdmin = userRole === "org_admin";

  const {
    data: teamsRes,
    isLoading: teamsLoading,
    isError: teamsIsError,
    error: teamsError,
    refetch: refetchTeams,
  } = useGetTeamsByOrgQuery(orgId);
  const {
    data: deptsRes,
    isLoading: deptsLoading,
    isError: deptsIsError,
    error: deptsError,
    refetch: refetchDepartments,
  } = useGetDepartmentsByOrgQuery(orgId);
  const {
    data: membersRes,
    isLoading: membersLoading,
    isError: membersIsError,
    error: membersError,
    refetch: refetchMembers,
  } = useGetOrgMembersQuery(orgId);
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const teams = teamsRes?.data || [];
  const departments = deptsRes?.data || [];
  const members = membersRes?.data?.members || [];

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!departmentId) {
      setError("Please select a department for the team");
      return;
    }

    try {
      const res = await createTeam({
        orgId,
        departmentId,
        name,
        description,
        color,
        leadId: leadId || null,
      }).unwrap();

      if (res.success) {
        setName("");
        setDescription("");
        setDepartmentId("");
        setLeadId("");
        setColor("#2563eb");
        setShowCreateForm(false);
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to create team");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Teams</h2>
          <p className="text-sm text-muted-foreground">
            Unify members into specialized project teams to manage tasks and boards.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 max-w-xl animate-slideDown">
          <h3 className="font-semibold text-sm flex items-center gap-2 border-b border-border pb-2">
            <Network className="w-4 h-4 text-primary" />
            New Team Details
          </h3>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {(deptsIsError || membersIsError) && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs space-y-2">
              {deptsIsError && (
                <div className="flex items-start justify-between gap-3">
                  <span>{getErrorMessage(deptsError, "Departments could not be loaded.")}</span>
                  <button type="button" onClick={refetchDepartments} className="font-semibold text-primary hover:underline">
                    Retry
                  </button>
                </div>
              )}
              {membersIsError && (
                <div className="flex items-start justify-between gap-3">
                  <span>{getErrorMessage(membersError, "Members could not be loaded.")}</span>
                  <button type="button" onClick={refetchMembers} className="font-semibold text-primary hover:underline">
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {!deptsLoading && !deptsIsError && departments.length === 0 && (
            <div className="p-3 rounded-lg bg-secondary/40 border border-border text-xs text-muted-foreground">
              Create a department first. Teams must belong to a department.
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Team Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="UI Development"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Assigned Team Lead
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
                        : "-- Select Lead (Optional) --"}
                  </option>
                  {members.map((m) => (
                    <option key={m.userId?._id} value={m.userId?._id}>
                      {m.userId?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Associated Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  disabled={deptsLoading || deptsIsError || departments.length === 0}
                  className="w-full p-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all font-medium"
                >
                  <option value="">
                    {deptsLoading
                      ? "Loading departments..."
                      : deptsIsError
                        ? "Departments unavailable"
                        : departments.length === 0
                          ? "Create a department first"
                          : "-- Select Department --"}
                  </option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Team Color Identifier
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-9 p-0.5 rounded-lg border border-border bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
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
                  placeholder="Team responsibilities..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating || deptsLoading || deptsIsError || departments.length === 0}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {isCreating ? "Creating..." : "Save Team"}
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

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teamsLoading && (
          <ListSkeleton />
        )}

        {!teamsLoading && teamsIsError && (
          <ErrorState
            title="Teams failed to load"
            message={getErrorMessage(teamsError, "We could not load teams for this workspace.")}
            onRetry={refetchTeams}
          />
        )}

        {!teamsLoading && !teamsIsError && teams.length === 0 && (
          <div className="col-span-2 text-center py-20 border border-dashed rounded-xl bg-card">
            <Network className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">No Teams Created</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Click the "Create Team" button above to establish your first workspace team.
            </p>
          </div>
        )}

        {teams.map((team) => {
          const lead = members.find((m) => m.userId?._id === team.leadId);
          const dept = departments.find((d) => d._id === team.departmentId);
          return (
            <div
              key={team._id}
              className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color || "#2563eb" }}
                    />
                    {team.name}
                  </h3>
                  <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded text-muted-foreground font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    {team.members?.length || 0} Members
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {team.description || "No description provided."}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  {dept && (
                    <div className="flex items-center gap-1">
                      <Bookmark className="w-3.5 h-3.5 text-primary" />
                      <span>Dept: </span>
                      <span className="font-semibold text-foreground">{dept.name}</span>
                    </div>
                  )}
                  {lead && (
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>Lead: </span>
                      <span className="font-semibold text-foreground">{lead.userId?.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                <Link
                  to={`/orgs/${orgId}/teams/${team._id}`}
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  View details
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

export default TeamList;
