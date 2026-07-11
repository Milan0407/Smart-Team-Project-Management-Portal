import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useUpdateNotificationSettingsMutation,
} from "./authApiSlice";
import { Shield, Key, Laptop, Power, AlertCircle, CheckCircle2, Bell } from "lucide-react";

const Profile = () => {
  const { userProfile, refetchUser } = useOutletContext();
  const user = userProfile?.data;

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState(null);
  const [pwdSuccess, setPwdSuccess] = useState(null);

  const [changePassword, { isLoading: isChangingPwd }] = useChangePasswordMutation();
  const { data: sessionsRes, refetch: refetchSessions } = useGetSessionsQuery();
  const [revokeSession, { isLoading: isRevoking }] = useRevokeSessionMutation();
  const [updateNotificationSettings, { isLoading: isUpdatingSettings }] = useUpdateNotificationSettingsMutation();

  const [settingsSuccess, setSettingsSuccess] = useState(null);
  const [settingsError, setSettingsError] = useState(null);

  const notificationSettings = user?.notificationSettings || {
    taskAssigned: { email: true, inApp: true },
    commentMention: { email: true, inApp: true },
    wikiUpdated: { email: false, inApp: true },
  };

  const handleNotificationToggle = async (category, channel) => {
    setSettingsSuccess(null);
    setSettingsError(null);

    const updatedCategory = {
      ...notificationSettings[category],
      [channel]: !notificationSettings[category][channel],
    };

    try {
      await updateNotificationSettings({
        [category]: updatedCategory,
      }).unwrap();
      setSettingsSuccess("Notification preferences updated successfully.");
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (err) {
      setSettingsError(err?.data?.message || "Failed to update notification preferences");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match");
      return;
    }

    try {
      const res = await changePassword({ currentPassword, newPassword }).unwrap();
      if (res.success) {
        setPwdSuccess("Password updated successfully! Other sessions have been signed out.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        refetchSessions();
      } else {
        setPwdError(res.message || "Failed to update password");
      }
    } catch (err) {
      setPwdError(err?.data?.message || "Incorrect current password or update error");
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId).unwrap();
      refetchSessions();
      refetchUser(); // Refresh user profile just in case active session context changes
    } catch (err) {
      console.error("Failed to revoke session", err);
    }
  };

  const sessions = sessionsRes?.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account & Security Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal details, update security credentials, and view active sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <div className="md:col-span-1 p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-bold text-primary text-3xl uppercase">
              {user?.name?.substring(0, 2) || "U"}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user?.name}</h3>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Status:</span>
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="font-semibold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Right column with settings panels */}
        <div className="md:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
              <Key className="w-4.5 h-4.5 text-primary" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {pwdError && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {pwdSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPwd}
                className="px-4 py-2 mt-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all disabled:opacity-50"
              >
                {isChangingPwd ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Notification Settings Card */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-2">
              <Bell className="w-4.5 h-4.5 text-primary" />
              Notification Settings
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Configure how you wish to receive notifications from organization activities.
            </p>

            {settingsSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {settingsSuccess}
              </div>
            )}
            {settingsError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {settingsError}
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden bg-secondary/5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/20 font-semibold text-muted-foreground">
                    <th className="p-3">Notification Channel</th>
                    <th className="p-3 text-center">In-App Alerts</th>
                    <th className="p-3 text-center">Email Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3">
                      <div className="font-medium text-foreground">Task Assignments</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">When you are assigned to a task</div>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.taskAssigned.inApp}
                        onChange={() => handleNotificationToggle("taskAssigned", "inApp")}
                        disabled={isUpdatingSettings}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.taskAssigned.email}
                        onChange={() => handleNotificationToggle("taskAssigned", "email")}
                        disabled={isUpdatingSettings}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <div className="font-medium text-foreground">Task Comments</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">When someone comments on your task</div>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.commentMention.inApp}
                        onChange={() => handleNotificationToggle("commentMention", "inApp")}
                        disabled={isUpdatingSettings}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.commentMention.email}
                        onChange={() => handleNotificationToggle("commentMention", "email")}
                        disabled={isUpdatingSettings}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">
                      <div className="font-medium text-foreground">Wiki Page Updates</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">When a wiki document is created or modified</div>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.wikiUpdated.inApp}
                        onChange={() => handleNotificationToggle("wikiUpdated", "inApp")}
                        disabled={isUpdatingSettings}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.wikiUpdated.email}
                        onChange={() => handleNotificationToggle("wikiUpdated", "email")}
                        disabled={isUpdatingSettings}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions Management */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
        <h3 className="text-base font-semibold flex items-center gap-2 mb-2">
          <Shield className="w-4.5 h-4.5 text-primary" />
          Active Login Sessions
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          Review devices that currently have active session authorization tokens. You can revoke any unfamiliar session.
        </p>

        <div className="space-y-4">
          {sessions.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No active sessions loaded.
            </div>
          )}
          {sessions.map((session) => (
            <div
              key={session._id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-secondary/15 hover:bg-secondary/35 transition-all gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold truncate max-w-sm">
                    {session.deviceInfo?.userAgent || "Unknown Device"}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="bg-secondary px-1.5 py-0.5 rounded border border-border">
                      IP: {session.ipAddress || "Unknown"}
                    </span>
                    <span>•</span>
                    <span>Started: {new Date(session.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                {session.isCurrent ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    This Session
                  </span>
                ) : (
                  <button
                    onClick={() => handleRevokeSession(session._id)}
                    disabled={isRevoking}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-md transition-all disabled:opacity-50"
                  >
                    <Power className="w-3 h-3" />
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
