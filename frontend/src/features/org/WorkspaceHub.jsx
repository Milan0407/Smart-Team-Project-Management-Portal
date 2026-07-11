import { useState, useEffect } from "react";
import { useNavigate, useOutletContext, Link } from "react-router-dom";
import { Building, Plus, Search, Loader2, ArrowRight, XCircle, Clock, ShieldCheck, User } from "lucide-react";
import {
  useGetMyPendingJoinRequestQuery,
  useCreateJoinRequestMutation,
  useCancelJoinRequestMutation,
} from "./orgApiSlice";

const WorkspaceHub = () => {
  const navigate = useNavigate();
  const { userProfile, refetchUser } = useOutletContext();
  const orgs = userProfile?.data?.orgMemberships || [];

  const [orgSlug, setOrgSlug] = useState("");
  const [role, setRole] = useState("developer");
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Queries
  const { data: pendingRes, isLoading: loadingPending, refetch: refetchPending } = useGetMyPendingJoinRequestQuery();
  const [createJoinRequest, { isLoading: isSubmitting }] = useCreateJoinRequestMutation();
  const [cancelJoinRequest, { isLoading: isCancelling }] = useCancelJoinRequestMutation();

  const pendingRequest = pendingRes?.data;

  // Auto-redirect if user already has organizations and goes to `/workspace-hub`
  useEffect(() => {
    if (orgs.length > 0 && !pendingRequest) {
      // Just double check we don't block them
      navigate(`/orgs/${orgs[0].orgId?._id}/dashboard`);
    }
  }, [orgs, pendingRequest, navigate]);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (orgSlug.trim().length < 2) {
      setFormError("Slug must be at least 2 characters");
      return;
    }

    try {
      const res = await createJoinRequest({ orgSlug, role }).unwrap();
      if (res.success) {
        setFormSuccess("Join request submitted successfully!");
        setOrgSlug("");
        refetchPending();
      } else {
        setFormError(res.message || "Failed to submit join request");
      }
    } catch (err) {
      setFormError(err?.data?.message || "Organization slug not found or request already pending.");
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      const res = await cancelJoinRequest(requestId).unwrap();
      if (res.success) {
        setFormSuccess("Request cancelled successfully.");
        refetchPending();
      }
    } catch (err) {
      setFormError(err?.data?.message || "Failed to cancel join request.");
    }
  };

  if (loadingPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fadeIn">
      {/* Welcome Header */}
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
          Workspace Directory
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto font-medium">
          Create a fresh company organization or request access to join an active workspace setup.
        </p>
      </div>

      {formSuccess && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 animate-pulse" />
          {formSuccess}
        </div>
      )}

      {formError && (
        <div className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <XCircle className="w-4.5 h-4.5" />
          {formError}
        </div>
      )}

      {pendingRequest ? (
        /* Pending Request Screen */
        <div className="max-w-md mx-auto rounded-3xl border border-amber-500/25 bg-amber-500/5 p-8 text-center backdrop-blur-md shadow-xl space-y-6">
          <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto animate-pulse">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Request Pending Approval</h2>
            <p className="text-xs text-muted-foreground">
              Your request to join the organization workspace is active.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/40 text-left border border-border/60 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Workspace:</span>
              <span className="font-bold text-foreground">{pendingRequest.orgId?.name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Requested Role:</span>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] uppercase font-bold">
                {pendingRequest.role.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-semibold">Submitted:</span>
              <span className="text-muted-foreground/80 font-medium">
                {new Date(pendingRequest.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            Once an administrator approves your request, your workspace will activate automatically.
          </p>

          <div className="pt-2">
            <button
              onClick={() => handleCancelRequest(pendingRequest._id)}
              disabled={isCancelling}
              className="w-full flex items-center justify-center gap-1.5 py-3 px-4 bg-destructive hover:bg-destructive/95 text-destructive-foreground text-xs font-bold rounded-xl hover:shadow-lg transition-all"
            >
              {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Cancel Join Request
            </button>
          </div>
        </div>
      ) : (
        /* Choice Screen */
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card A: Create Workspace */}
          <div className="flex flex-col p-8 rounded-3xl border border-border/80 bg-card/45 backdrop-blur-xl shadow-sm hover-lift space-y-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <Plus className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-extrabold tracking-tight">Create a Workspace</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Establish a brand-new workspace organization. You will be set as the Organization Administrator and can manage departments, create projects, and hire team members.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/orgs/create"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl text-xs transition-all hover:shadow-md hover:shadow-primary/20"
              >
                Create New Org
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card B: Join Workspace */}
          <div className="flex flex-col p-8 rounded-3xl border border-border/80 bg-card/45 backdrop-blur-xl shadow-sm hover-lift space-y-6">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-tight">Join a Workspace</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Already have an organization workspace running in your team? Request to join by typing the organization's unique URL slug.
              </p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
                  Workspace URL Slug
                </label>
                <div className="flex rounded-xl border border-border/80 bg-secondary/35 overflow-hidden text-xs">
                  <span className="bg-secondary/70 text-muted-foreground/80 px-3 py-2.5 border-r border-border/60 text-xs font-semibold flex items-center">
                    /orgs/
                  </span>
                  <input
                    type="text"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    required
                    placeholder="acme-corp"
                    className="w-full px-3.5 py-2.5 bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
                  Requested Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/35 border border-border/80 text-xs text-foreground outline-none focus:border-primary transition-all font-medium"
                >
                  <option value="developer">Developer</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="dept_manager">Department Manager</option>
                  <option value="viewer">Viewer / Guest</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  {isSubmitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null}
                  Request Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceHub;
