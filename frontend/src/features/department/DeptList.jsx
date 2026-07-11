import { useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import {
  useGetDepartmentsByOrgQuery,
  useCreateDepartmentMutation,
} from "./deptApiSlice";
import { useGetOrgMembersQuery } from "../org/orgApiSlice";
import { Landmark, Plus, Users, ChevronRight, User, AlertCircle, RefreshCw } from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || fallback;

const ListSkeleton = () => (
  <>
    {[1, 2].map((item) => (
      <div key={item} className="p-6 rounded-xl border border-border bg-card shadow-sm animate-pulse">
        <div className="flex items-center justify-between gap-3">
          <div className="h-5 w-44 rounded bg-secondary" />
          <div className="h-6 w-20 rounded bg-secondary" />
        </div>
        <div className="mt-5 h-3 w-full rounded bg-secondary" />
        <div className="mt-2 h-3 w-2/3 rounded bg-secondary" />
        <div className="mt-6 h-px bg-border" />
        <div className="mt-4 h-4 w-36 rounded bg-secondary" />
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

const DeptList = () => {
  const { orgId } = useParams();
  const { userProfile } = useOutletContext();
  const orgs = userProfile?.data?.orgMemberships || [];
  const activeOrgMember = orgs.find((o) => o.orgId?._id === orgId);
  const userRole = activeOrgMember?.role;
  const isAdmin = userRole === "org_admin";

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
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");
  const [parentDeptId, setParentDeptId] = useState("");
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const departments = deptsRes?.data || [];
  const members = membersRes?.data?.members || [];

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await createDept({
        orgId,
        name,
        description,
        managerId: managerId || null,
        parentDeptId: parentDeptId || null,
      }).unwrap();

      if (res.success) {
        setName("");
        setDescription("");
        setManagerId("");
        setParentDeptId("");
        setShowCreateForm(false);
      }
    } catch (err) {
      setError(err?.data?.message || "Failed to create department");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Departments</h2>
          <p className="text-sm text-muted-foreground">
            Structure your organization by creating, managing, and detailing departments.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Department
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 max-w-xl animate-slideDown">
          <h3 className="font-semibold text-sm flex items-center gap-2 border-b border-border pb-2">
            <Landmark className="w-4 h-4 text-primary" />
            New Department Details
          </h3>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {membersIsError && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs flex items-start justify-between gap-3">
              <span>{getErrorMessage(membersError, "Managers could not be loaded.")}</span>
              <button type="button" onClick={refetchMembers} className="font-semibold text-primary hover:underline">
                Retry
              </button>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Department Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Engineering"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Assigned Manager
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  disabled={membersLoading || membersIsError}
                  className="w-full p-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all"
                >
                  <option value="">
                    {membersLoading
                      ? "Loading members..."
                      : membersIsError
                        ? "Members unavailable"
                        : "-- Select Manager (Optional) --"}
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
                  Parent Department
                </label>
                <select
                  value={parentDeptId}
                  onChange={(e) => setParentDeptId(e.target.value)}
                  disabled={deptsLoading || deptsIsError}
                  className="w-full p-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all"
                >
                  <option value="">
                    {deptsLoading
                      ? "Loading departments..."
                      : deptsIsError
                        ? "Departments unavailable"
                        : "-- No Parent Department --"}
                  </option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
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
                  placeholder="Department focus and goals..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all"
              >
                {isCreating ? "Creating..." : "Save Department"}
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

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deptsLoading && (
          <ListSkeleton />
        )}

        {!deptsLoading && deptsIsError && (
          <ErrorState
            title="Departments failed to load"
            message={getErrorMessage(deptsError, "We could not load departments for this workspace.")}
            onRetry={refetchDepartments}
          />
        )}

        {!deptsLoading && !deptsIsError && departments.length === 0 && (
          <div className="col-span-2 text-center py-20 border border-dashed rounded-xl bg-card">
            <Landmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-semibold text-sm">No Departments Defined</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Click the "Create Department" button above to start structure definition.
            </p>
          </div>
        )}

        {departments.map((dept) => {
          const manager = members.find((m) => m.userId?._id === dept.managerId);
          return (
            <div
              key={dept._id}
              className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-primary" />
                    {dept.name}
                  </h3>
                  <span className="text-[10px] bg-secondary border border-border px-2 py-0.5 rounded text-muted-foreground font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    {dept.members?.length || 0} Members
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {dept.description || "No description provided."}
                </p>

                {manager && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border/50 pt-3">
                    <User className="w-4 h-4 text-primary" />
                    <span>Manager: </span>
                    <span className="font-semibold text-foreground">{manager.userId?.name}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                <Link
                  to={`/orgs/${orgId}/departments/${dept._id}`}
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

export default DeptList;
