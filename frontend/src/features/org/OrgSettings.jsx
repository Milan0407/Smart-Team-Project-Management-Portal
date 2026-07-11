import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  useGetOrgQuery,
  useUpdateOrgMutation,
  useGetOrgMembersQuery,
  useInviteOrgMemberMutation,
  useUpdateOrgMemberRoleMutation,
  useRemoveOrgMemberMutation,
  useGetOrgInvitationsQuery,
  useInviteByEmailMutation,
  useRevokeInvitationMutation,
  useGetOrgJoinRequestsQuery,
  useResolveJoinRequestMutation,
} from "./orgApiSlice";
import { useLazySearchUserByEmailQuery } from "../auth/authApiSlice";
import {
  Settings,
  Users,
  Search,
  UserPlus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Palette,
} from "lucide-react";

const OrgSettings = () => {
  const { orgId } = useParams();

  // Load queries
  const { data: orgRes, refetch: refetchOrg } = useGetOrgQuery(orgId);
  const { data: membersRes, refetch: refetchMembers } = useGetOrgMembersQuery(orgId);
  const { data: invitesRes, refetch: refetchInvites } = useGetOrgInvitationsQuery(orgId);

  const org = orgRes?.data;
  const members = membersRes?.data?.members || [];
  const pendingInvites = invitesRes?.data || [];

  // Update Org details form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [features, setFeatures] = useState({ projects: true, chat: true, documents: true });

  const [updateOrg, { isLoading: isUpdatingOrg }] = useUpdateOrgMutation();

  // Invite user state
  const [emailInput, setEmailInput] = useState("");
  const [inviteRole, setInviteRole] = useState("developer");
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [inviteByEmail, { isLoading: isInvitingByEmail }] = useInviteByEmailMutation();
  const [revokeInvitation] = useRevokeInvitationMutation();
  const [updateRole] = useUpdateOrgMemberRoleMutation();
  const [removeMember] = useRemoveOrgMemberMutation();

  const { data: joinRequestsRes, refetch: refetchJoinRequests } = useGetOrgJoinRequestsQuery(orgId);
  const [resolveJoinRequest, { isLoading: isResolvingRequest }] = useResolveJoinRequestMutation();
  const joinRequests = joinRequestsRes?.data || [];

  const handleResolveJoinRequest = async (requestId, action, userName) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await resolveJoinRequest({ orgId, requestId, action }).unwrap();
      if (res.success) {
        setActionSuccess(`Join request for ${userName} was successfully ${action}d.`);
        refetchJoinRequests();
        refetchMembers();
      }
    } catch (err) {
      setActionError(err?.data?.message || `Failed to ${action} join request`);
    }
  };

  useEffect(() => {
    if (org) {
      setName(org.name || "");
      setSlug(org.slug || "");
      setPrimaryColor(org.settings?.branding?.primaryColor || "#2563eb");
      setFeatures({
        projects: org.settings?.features?.projects ?? true,
        chat: org.settings?.features?.chat ?? true,
        documents: org.settings?.features?.documents ?? true,
      });
    }
  }, [org]);

  // Handle Org updates
  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await updateOrg({
        id: orgId,
        name,
        slug,
        settings: {
          branding: { primaryColor },
          features,
        },
      }).unwrap();

      if (res.success) {
        setActionSuccess("Organization updated successfully!");
        refetchOrg();
      }
    } catch (err) {
      setActionError(err?.data?.message || "Failed to update organization details");
    }
  };

  // Search user by email for invite
  const handleInviteByEmail = async (e) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    if (!emailInput) return;

    try {
      const res = await inviteByEmail({
        orgId,
        email: emailInput,
        role: inviteRole,
      }).unwrap();

      if (res.success) {
        setActionSuccess(`Invitation email successfully sent to ${emailInput}`);
        setEmailInput("");
        refetchInvites();
      }
    } catch (err) {
      setActionError(err?.data?.message || "Failed to invite email");
    }
  };

  const handleRevokeInvite = async (invitationId, email) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await revokeInvitation({ orgId, invitationId }).unwrap();
      if (res.success) {
        setActionSuccess(`Successfully revoked invitation for ${email}`);
        refetchInvites();
      }
    } catch (err) {
      setActionError(err?.data?.message || "Failed to revoke invitation");
    }
  };

  // Update member role
  const handleRoleChange = async (uid, newRole) => {
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await updateRole({ orgId, uid, role: newRole }).unwrap();
      if (res.success) {
        setActionSuccess("Member role updated successfully.");
        refetchMembers();
      }
    } catch (err) {
      setActionError(err?.data?.message || "Failed to update member role");
    }
  };

  // Remove member
  const handleRemoveMember = async (uid, username) => {
    if (!confirm(`Are you sure you want to remove ${username} from the organization?`)) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await removeMember({ orgId, uid }).unwrap();
      if (res.success) {
        setActionSuccess(`Removed ${username} from the organization.`);
        refetchMembers();
      }
    } catch (err) {
      setActionError(err?.data?.message || "Failed to remove member");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure organization branding, customize feature offerings, and manage membership access control list.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings and Branding Card */}
        <div className="md:col-span-2 p-6 rounded-xl border border-border bg-card shadow-sm space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-primary" />
            General details & Settings
          </h3>
          <form onSubmit={handleUpdateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Organization name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Workspace URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  required
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="slug-path"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Primary Branding Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-9 p-0.5 rounded-lg border border-border bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Feature Checkboxes */}
            <div className="border-t border-border pt-4 space-y-3">
              <label className="block text-xs font-bold text-muted-foreground">Enabled Features</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-all">
                  <input
                    type="checkbox"
                    checked={features.projects}
                    onChange={(e) => setFeatures({ ...features, projects: e.target.checked })}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className="text-xs font-medium">Projects Module</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-all">
                  <input
                    type="checkbox"
                    checked={features.chat}
                    onChange={(e) => setFeatures({ ...features, chat: e.target.checked })}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className="text-xs font-medium">Chat Module</span>
                </label>
                <label className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/15 hover:bg-secondary/30 cursor-pointer select-none transition-all">
                  <input
                    type="checkbox"
                    checked={features.documents}
                    onChange={(e) => setFeatures({ ...features, documents: e.target.checked })}
                    className="rounded text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className="text-xs font-medium">Documents Module</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingOrg}
              className="px-4 py-2 mt-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all disabled:opacity-50"
            >
              {isUpdatingOrg ? "Saving..." : "Save Config"}
            </button>
          </form>
        </div>

        {/* Invite Member by Email Panel */}
        <div className="md:col-span-1 p-6 rounded-xl border border-border bg-card shadow-sm space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-primary" />
            Invite Member
          </h3>

          <form onSubmit={handleInviteByEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs outline-none focus:border-primary transition-all"
                placeholder="user@domain.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-muted-foreground">Select Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full p-2 bg-secondary/40 border border-border rounded-lg text-xs"
              >
                <option value="org_admin">Org Admin</option>
                <option value="dept_manager">Department Manager</option>
                <option value="project_manager">Project Manager</option>
                <option value="team_lead">Team Lead</option>
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isInvitingByEmail}
              className="w-full py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all"
            >
              {isInvitingByEmail ? "Sending Invite..." : "Send Invite Link"}
            </button>
          </form>
        </div>

        {/* Member Access Management list (spanning entire width below) */}
        <div className="md:col-span-3 p-6 rounded-xl border border-border bg-card shadow-sm space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border pb-3">
            <Users className="w-4.5 h-4.5 text-primary" />
            Workspace Access Control List (ACL)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Role inside Org</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const u = m.userId;
                  if (!u) return null;
                  const isOwner = org?.ownerId?.toString() === u._id?.toString();

                  return (
                    <tr key={u._id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary uppercase">
                          {u.name?.substring(0, 2) || "U"}
                        </div>
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            u.isActive
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          }`}
                        >
                          {u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOwner ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 max-w-fit uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Owner / Admin
                          </span>
                        ) : (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="bg-secondary/40 border border-border rounded px-2 py-1 text-xs outline-none focus:border-primary transition-all font-medium"
                          >
                            <option value="org_admin">Org Admin</option>
                            <option value="dept_manager">Department Manager</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="team_lead">Team Lead</option>
                            <option value="developer">Developer</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isOwner && (
                          <button
                            onClick={() => handleRemoveMember(u._id, u.name)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all inline-flex items-center justify-center"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pending Invitations Table */}
        <div className="md:col-span-3 p-6 rounded-xl border border-border bg-card shadow-sm space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border pb-3">
            <Users className="w-4.5 h-4.5 text-primary" />
            Pending Invitations
          </h3>

          <div className="overflow-x-auto">
            {pendingInvites.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic">
                No pending invitations.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Invited Email</th>
                    <th className="py-3 px-4">Role Assigned</th>
                    <th className="py-3 px-4">Invited By</th>
                    <th className="py-3 px-4">Expires At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((invite) => (
                    <tr key={invite._id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {invite.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary/80 border border-border text-muted-foreground uppercase">
                          {invite.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {invite.invitedBy?.name || "Unknown"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRevokeInvite(invite._id, invite.email)}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 transition-all inline-flex items-center justify-center"
                          title="Revoke Invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pending Join Requests Table */}
        <div className="md:col-span-3 p-6 rounded-xl border border-border bg-card shadow-sm space-y-6">
          <h3 className="text-base font-semibold flex items-center gap-2 border-b border-border pb-3">
            <Users className="w-4.5 h-4.5 text-primary" />
            Pending Join Requests
          </h3>

          <div className="overflow-x-auto">
            {joinRequests.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground italic">
                No pending join requests.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Requested Role</th>
                    <th className="py-3 px-4">Request Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.map((req) => (
                    <tr key={req._id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {req.userId?.name || "Unknown"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {req.userId?.email || "Unknown"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase">
                          {req.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleResolveJoinRequest(req._id, "approve", req.userId?.name)}
                          disabled={isResolvingRequest}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleResolveJoinRequest(req._id, "reject", req.userId?.name)}
                          disabled={isResolvingRequest}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrgSettings;
