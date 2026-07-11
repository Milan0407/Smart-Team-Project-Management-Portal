import { useState } from "react";
import { useParams, useNavigate, Link, useOutletContext } from "react-router-dom";
import {
  useGetTeamQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useAssignTeamLeadMutation,
  useDeleteTeamMutation,
} from "./teamApiSlice";
import { useGetOrgMembersQuery } from "../org/orgApiSlice";
import { useGetDepartmentsByOrgQuery } from "../department/deptApiSlice";
import { Network, ArrowLeft, Users, User, Trash2, Plus, AlertCircle, CheckCircle, RefreshCw, Info } from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || fallback;

const getId = (value) => (value?._id || value || "").toString();

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "U";

const formatRole = (role = "") =>
  role
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const DetailSkeleton = () => (
  <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
    <div className="h-5 w-32 rounded bg-secondary" />
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="h-7 w-64 max-w-full rounded bg-secondary" />
      <div className="mt-5 h-4 w-full rounded bg-secondary" />
      <div className="mt-3 h-4 w-2/3 rounded bg-secondary" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-64 rounded-xl border border-border bg-card" />
      <div className="h-64 rounded-xl border border-border bg-card md:col-span-2" />
    </div>
  </div>
);

const ErrorState = ({ title, message, onRetry, backTo }) => (
  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
    <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
    <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
      <Link
        to={backTo}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
      >
        Back to Teams
      </Link>
    </div>
  </div>
);

const TeamDetails = () => {
  const { orgId, teamId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useOutletContext();
  
  const orgs = userProfile?.data?.orgMemberships || [];
  const activeOrgMember = orgs.find((o) => o.orgId?._id === orgId);
  const userRole = activeOrgMember?.role;
  const isAdmin = userRole === "org_admin";

  // Load queries
  const {
    data: teamRes,
    isLoading: teamLoading,
    isError: teamIsError,
    error: teamError,
    refetch: refetchTeam,
  } = useGetTeamQuery(teamId);
  const {
    data: orgMembersRes,
    isLoading: orgMembersLoading,
    isError: orgMembersIsError,
    error: orgMembersError,
    refetch: refetchOrgMembers,
  } = useGetOrgMembersQuery(orgId);

  const [addMember, { isLoading: isAdding }] = useAddTeamMemberMutation();
  const [removeMember, { isLoading: isRemoving }] = useRemoveTeamMemberMutation();
  const [assignLead, { isLoading: isAssigning }] = useAssignTeamLeadMutation();
  const [deleteTeam, { isLoading: isDeleting }] = useDeleteTeamMutation();

  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberRole, setMemberRole] = useState("developer");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const team = teamRes?.data;
  const orgMembers = orgMembersRes?.data?.members || [];
  const teamMembers = team?.members || [];

  const {
    data: deptsRes,
    isError: deptsIsError,
    error: deptsError,
    refetch: refetchDepartments,
  } = useGetDepartmentsByOrgQuery(orgId);
  const departments = deptsRes?.data || [];
  const currentDept = departments.find((d) => getId(d._id) === getId(team?.departmentId));
  const isDeptManager = getId(currentDept?.managerId) === getId(userProfile?.data?._id);
  const isLead = getId(team?.leadId) === getId(userProfile?.data?._id);

  const isDeactivatable = isAdmin || isDeptManager;
  const isLeadAssignable = isAdmin || isDeptManager;
  const canManageMembers = isAdmin || isDeptManager || isLead;

  // Filter organization members who are not already in the team
  const nonTeamMembers = orgMembers.filter(
    (om) => !teamMembers.some((tm) => getId(tm.userId) === getId(om.userId))
  );
  const noAvailableMembers = !orgMembersLoading && !orgMembersIsError && nonTeamMembers.length === 0;
  const addMemberDisabled = isAdding || orgMembersLoading || orgMembersIsError || noAvailableMembers || !selectedUserId;

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedUserId) {
      setError("Please select a user to add");
      return;
    }

    try {
      const res = await addMember({
        id: teamId,
        userId: selectedUserId,
        role: memberRole,
      }).unwrap();

      if (res.success) {
        setSuccess("Member added successfully to team.");
        setSelectedUserId("");
        refetchTeam();
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to add member to team");
    }
  };

  const handleRemoveMember = async (uid, username) => {
    if (!confirm(`Are you sure you want to remove ${username} from the team?`)) {
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      const res = await removeMember({ id: teamId, uid }).unwrap();
      if (res.success) {
        setSuccess(`Removed ${username} from team.`);
        refetchTeam();
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to remove team member");
    }
  };

  const handleLeadChange = async (leadId) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await assignLead({
        id: teamId,
        leadId: leadId || null,
      }).unwrap();

      if (res.success) {
        setSuccess("Team lead updated successfully.");
        refetchTeam();
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to update team lead");
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete (deactivate) this team?")) {
      return;
    }
    setError(null);

    try {
      const res = await deleteTeam(teamId).unwrap();
      if (res.success) {
        navigate(`/orgs/${orgId}/teams`);
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to delete team");
    }
  };

  if (teamLoading) {
    return <DetailSkeleton />;
  }

  if (teamIsError) {
    return (
      <ErrorState
        title="Team failed to load"
        message={getErrorMessage(teamError, "We could not load this team.")}
        onRetry={refetchTeam}
        backTo={`/orgs/${orgId}/teams`}
      />
    );
  }

  if (!team) {
    return (
      <div className="text-center py-20 border border-dashed rounded-xl bg-card">
        <h3 className="font-bold text-lg text-destructive">Team Not Found</h3>
        <p className="text-xs text-muted-foreground mt-2">
          Verify the team ID or navigate back to the teams list.
        </p>
        <Link to={`/orgs/${orgId}/teams`} className="text-xs text-primary underline mt-4 block">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Back button */}
      <div className="flex justify-between items-center">
        <Link
          to={`/orgs/${orgId}/teams`}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Teams
        </Link>
        {isDeactivatable && (
          <button
            onClick={handleDeleteTeam}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/20 hover:bg-destructive/10 text-destructive text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Deactivate Team
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
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: team.color || "#2563eb" }}
            />
            {team.name}
          </h2>
          <span className="text-[10px] bg-secondary border border-border px-2.5 py-0.5 rounded text-muted-foreground font-semibold flex items-center gap-1">
            <Users className="w-4 h-4 text-primary" />
            {team.members?.length || 0} Members
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {team.description || "No description provided for this team."}
        </p>

        {/* Lead Settings */}
        <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-primary" />
              Team Lead Assignment
            </label>
            <select
              value={getId(team.leadId)}
              onChange={(e) => handleLeadChange(e.target.value)}
              disabled={isAssigning || !isLeadAssignable || orgMembersLoading || orgMembersIsError}
              className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs outline-none focus:border-primary transition-all font-medium"
            >
              <option value="">
                {orgMembersLoading
                  ? "Loading members..."
                  : orgMembersIsError
                    ? "Members unavailable"
                    : "-- No Lead Assigned --"}
              </option>
              {orgMembers.map((m) => (
                <option key={getId(m.userId)} value={getId(m.userId)}>
                  {m.userId?.name || "Unnamed member"} ({formatRole(m.role)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add Member Form */}
        {canManageMembers && (
          <div className="md:col-span-1 p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2">
              <Plus className="w-4.5 h-4.5 text-primary" />
              Add Member to Team
            </h3>
            {(orgMembersIsError || deptsIsError) && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 space-y-2">
                {orgMembersIsError && (
                  <div className="flex items-start justify-between gap-3">
                    <span>{getErrorMessage(orgMembersError, "Workspace members could not be loaded.")}</span>
                    <button type="button" onClick={refetchOrgMembers} className="font-semibold text-primary hover:underline">
                      Retry
                    </button>
                  </div>
                )}
                {deptsIsError && (
                  <div className="flex items-start justify-between gap-3">
                    <span>{getErrorMessage(deptsError, "Department data could not be loaded.")}</span>
                    <button type="button" onClick={refetchDepartments} className="font-semibold text-primary hover:underline">
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
            {noAvailableMembers && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>All workspace members are already assigned to this team.</span>
              </div>
            )}
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">
                  Select Workspace Member
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={orgMembersLoading || orgMembersIsError || noAvailableMembers}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs outline-none focus:border-primary transition-all"
                >
                  <option value="">
                    {orgMembersLoading
                      ? "Loading members..."
                      : orgMembersIsError
                        ? "Members unavailable"
                        : noAvailableMembers
                          ? "All members are already assigned"
                          : "-- Select Member --"}
                  </option>
                  {nonTeamMembers.map((m) => (
                    <option key={getId(m.userId)} value={getId(m.userId)}>
                      {m.userId?.name || "Unnamed member"} ({m.userId?.email || formatRole(m.role)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1.5">
                  Select Team Role
                </label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  disabled={orgMembersLoading || orgMembersIsError || noAvailableMembers}
                  className="w-full p-2 bg-secondary/50 border border-border rounded-lg text-xs outline-none focus:border-primary transition-all"
                >
                  <option value="developer">Developer</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addMemberDisabled}
                className="w-full py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? "Adding..." : "Add to Team"}
              </button>
            </form>
          </div>
        )}

        {/* Members List Table */}
        <div className={`${canManageMembers ? "md:col-span-2" : "md:col-span-3"} p-6 rounded-xl border border-border bg-card shadow-sm space-y-4`}>
          <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2">
            <Users className="w-4.5 h-4.5 text-primary" />
            Team Members
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                      No members assigned to this team.
                    </td>
                  </tr>
                )}
                {teamMembers.map((tm) => {
                  const user = tm.userId && typeof tm.userId === "object" ? tm.userId : null;
                  const uid = getId(tm.userId);
                  const isLead = getId(team.leadId) === uid;
                  return (
                    <tr key={uid || tm._id} className="border-b border-border/50 hover:bg-secondary/10 transition-all">
                      <td className="py-3 px-3 flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary uppercase">
                          {getInitials(user?.name)}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            {user?.name || "Unknown member"}
                            {isLead && (
                              <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] px-1 rounded font-bold uppercase">
                                Lead
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{user?.email || uid}</div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase bg-secondary px-1.5 py-0.5 rounded border border-border">
                          {formatRole(tm.role)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {canManageMembers && (
                          <button
                            onClick={() => handleRemoveMember(uid, user?.name || "this member")}
                            disabled={isRemoving || !uid}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all inline-flex items-center justify-center"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;
