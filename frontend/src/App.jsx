import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./features/layout/ProtectedRoute";
import AppLayout from "./features/layout/AppLayout";
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import Profile from "./features/auth/Profile";
import CreateOrg from "./features/org/CreateOrg";
import OrgDashboard from "./features/org/OrgDashboard";
import WorkspaceHub from "./features/org/WorkspaceHub";
import OrgSettings from "./features/org/OrgSettings";
import DeptList from "./features/department/DeptList";
import DeptDetails from "./features/department/DeptDetails";
import TeamList from "./features/team/TeamList";
import TeamDetails from "./features/team/TeamDetails";
import ProjectList from "./features/project/ProjectList";
import ProjectDetails from "./features/project/ProjectDetails";
import BoardDetails from "./features/board/BoardDetails";
import DmInbox from "./features/dm/DmInbox";
import AnalyticsDashboard from "./features/analytics/AnalyticsDashboard";
import DocumentWorkspace from "./features/document/DocumentWorkspace";
import AcceptInvite from "./features/org/AcceptInvite";
import OrgActivityFeed from "./features/org/OrgActivityFeed";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Private workspace pages */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<div className="text-xs text-muted-foreground">Loading workspace...</div>} />
            <Route path="/workspace-hub" element={<WorkspaceHub />} />
            <Route path="/orgs/create" element={<CreateOrg />} />
            <Route path="/orgs/:orgId/dashboard" element={<OrgDashboard />} />
            <Route path="/orgs/:orgId/settings" element={<OrgSettings />} />
            <Route path="/orgs/:orgId/activity" element={<OrgActivityFeed />} />
            <Route path="/orgs/:orgId/departments" element={<DeptList />} />
            <Route path="/orgs/:orgId/departments/:deptId" element={<DeptDetails />} />
            <Route path="/orgs/:orgId/teams" element={<TeamList />} />
            <Route path="/orgs/:orgId/teams/:teamId" element={<TeamDetails />} />
            <Route path="/orgs/:orgId/projects" element={<ProjectList />} />
            <Route path="/orgs/:orgId/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/orgs/:orgId/projects/:projectId/boards/:boardId" element={<BoardDetails />} />
            <Route path="/orgs/:orgId/messages" element={<DmInbox />} />
            <Route path="/orgs/:orgId/messages/:conversationId" element={<DmInbox />} />
            <Route path="/orgs/:orgId/analytics" element={<AnalyticsDashboard />} />
            <Route path="/orgs/:orgId/documents" element={<DocumentWorkspace />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
