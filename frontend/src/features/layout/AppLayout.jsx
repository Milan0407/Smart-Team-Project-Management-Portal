import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearCredentials, selectCurrentUser, selectCurrentToken } from "../auth/authSlice";
import { useGetCurrentUserQuery, useLogoutMutation } from "../auth/authApiSlice";
import { connectSocket, disconnectSocket, getSocket } from "../../shared/utils/socket";
import { useGetInboxQuery } from "../dm/dmApiSlice";
import NotificationBell from "../notification/NotificationBell";
import GlobalSearch from "../search/GlobalSearch";
import {
  LayoutDashboard,
  Settings,
  Users,
  LogOut,
  User,
  Plus,
  Menu,
  X,
  ChevronDown,
  Building,
  Sun,
  Moon,
  Layers,
  Network,
  ShieldAlert,
  Folder,
  Search,
  Command,
  MessageCircle,
  BarChart2,
  BookOpen,
  Activity,
} from "lucide-react";

const AppLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { orgId } = useParams();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: userProfile, refetch: refetchUser } = useGetCurrentUserQuery();
  const currentUser = useSelector(selectCurrentUser) || userProfile?.data;
  const token = useSelector(selectCurrentToken);
  const [logout] = useLogoutMutation();

  const { data: inboxRes, refetch: refetchInbox } = useGetInboxQuery(undefined, { skip: !orgId });
  const totalDmUnread = inboxRes?.data?.totalUnread || 0;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = () => {
      refetchInbox();
    };
    socket.on("dm:message", handler);
    return () => socket.off("dm:message", handler);
  }, [refetchInbox]);

  useEffect(() => {
    if (token) {
      connectSocket(token);
      return () => {
        disconnectSocket();
      };
    }
  }, [token]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (data) => {
      refetchUser();
      if (data && data.status === "approved" && data.orgId) {
        navigate(`/orgs/${data.orgId}/dashboard`);
      }
    };
    socket.on("join-request:resolved", handler);
    return () => socket.off("join-request:resolved", handler);
  }, [refetchUser, navigate]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      try {
        await logout(refreshToken).unwrap();
      } catch (err) {
        console.error("Failed to revoke current session during logout", err);
      }
    }

    dispatch(clearCredentials());
    disconnectSocket();
    navigate("/login");
  };

  const orgs = userProfile?.data?.orgMemberships || [];
  const activeOrgMember = orgs.find((o) => o.orgId?._id === orgId);
  const activeOrg = activeOrgMember?.orgId;
  const userRole = activeOrgMember?.role;
  const isAdmin = userRole === "org_admin";

  // Automatically select an organization if on base route or not inside an active org
  useEffect(() => {
    const isAllowedRouteWithoutOrg = 
      location.pathname === "/workspace-hub" || 
      location.pathname === "/orgs/create" || 
      location.pathname === "/profile";

    if (orgs.length === 0 && !isAllowedRouteWithoutOrg) {
      navigate("/workspace-hub");
    } else if (location.pathname === "/" && orgs.length > 0) {
      navigate(`/orgs/${orgs[0].orgId?._id}/dashboard`);
    }
  }, [location, orgs, navigate]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border/60 bg-card/45 backdrop-blur-xl transition-all duration-300 relative z-30">
        {/* Header / Org Selector */}
        <div className="relative p-4 border-b border-border/40">
          <div
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/35 hover:bg-secondary/60 hover:border-primary/30 cursor-pointer transition-all border border-border/50 shadow-sm"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md shadow-primary/10">
                {activeOrg ? activeOrg.name.charAt(0).toUpperCase() : "S"}
              </div>
              <span className="font-bold text-xs truncate text-foreground/90">
                {activeOrg ? activeOrg.name : "Select Org"}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground/80" />
          </div>

          {/* Org Switcher Dropdown */}
          {orgDropdownOpen && (
            <div className="absolute left-4 right-4 mt-2 p-1.5 bg-card/95 border border-border/80 rounded-xl shadow-xl z-50 backdrop-blur-xl animate-fadeIn">
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {orgs.map((o) => (
                  <div
                    key={o.orgId?._id}
                    onClick={() => {
                      setOrgDropdownOpen(false);
                      navigate(`/orgs/${o.orgId?._id}/dashboard`);
                    }}
                    className={`p-2 rounded-lg hover:bg-secondary/60 cursor-pointer text-xs truncate transition-all ${
                      o.orgId?._id === orgId ? "bg-primary/15 font-bold text-primary border-l-3 border-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {o.orgId?.name} ({o.role})
                  </div>
                ))}
              </div>
              <div className="border-t border-border/60 mt-1.5 pt-1.5">
                <Link
                  to="/orgs/create"
                  onClick={() => setOrgDropdownOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/60 text-xs text-primary font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create New Org
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {activeOrg ? (
            <>
              <div className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider px-2 mb-2">
                Workspace
              </div>
              {[
                { to: `/orgs/${orgId}/dashboard`, icon: LayoutDashboard, label: "Dashboard", end: true },
                { to: `/orgs/${orgId}/projects`, icon: Folder, label: "Projects" },
                { to: `/orgs/${orgId}/departments`, icon: Layers, label: "Departments" },
                { to: `/orgs/${orgId}/teams`, icon: Network, label: "Teams" },
                { to: `/orgs/${orgId}/messages`, icon: MessageCircle, label: "Messages", badge: totalDmUnread },
                { to: `/orgs/${orgId}/analytics`, icon: BarChart2, label: "Analytics" },
                { to: `/orgs/${orgId}/documents`, icon: BookOpen, label: "Wiki Docs" },
                { to: `/orgs/${orgId}/activity`, icon: Activity, label: "Activity Feed" },
                ...(isAdmin ? [{ to: `/orgs/${orgId}/settings`, icon: Settings, label: "Org Settings" }] : []),
              ].map((item) => {
                const isActive = item.end 
                  ? location.pathname.endsWith(item.to) 
                  : location.pathname.includes(item.to);
                
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all hover:translate-x-1 duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-bold border-l-4 border-primary shadow-sm shadow-primary/5"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </>
          ) : (
            <div className="text-center p-4 text-xs text-muted-foreground/60 italic">
              Please select or create an organization to access workspaces.
            </div>
          )}

          <div className="pt-4 border-t border-border/40 mt-4">
            <div className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider px-2 mb-2">
              Account
            </div>
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all hover:translate-x-1 duration-200 group ${
                location.pathname === "/profile"
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-bold border-l-4 border-primary shadow-sm shadow-primary/5"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <User className={`w-4 h-4 transition-transform group-hover:scale-110 ${location.pathname === "/profile" ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
              <span>My Profile</span>
            </Link>
          </div>
        </nav>

        {/* Footer / User Profile - Premium Glass card floating bottom */}
        <div className="mx-4 mb-4 p-3 rounded-2xl border border-border/50 bg-secondary/15 backdrop-blur-md flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-indigo-500/30 flex items-center justify-center font-extrabold text-primary text-[11px] uppercase border border-primary/20 shadow-inner flex-shrink-0">
              {currentUser?.name?.substring(0, 2) || "U"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate text-foreground/90 leading-tight">{currentUser?.name}</div>
              <div className="text-[9px] text-muted-foreground truncate">{currentUser?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <div className="flex flex-col flex-1 h-full overflow-hidden bg-background">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/60 bg-card/30 backdrop-blur-md z-40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl border border-border bg-secondary/40"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-extrabold text-base bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              SmartPortal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary/60 transition-all text-foreground/85"
            >
              {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[61px] bg-background/98 backdrop-blur-xl z-50 flex flex-col p-4 space-y-4">
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground/60 px-2 mb-1">
                Active Organization
              </div>
              <select
                value={orgId || ""}
                onChange={(e) => {
                  setMobileMenuOpen(false);
                  if (e.target.value === "create") {
                    navigate("/orgs/create");
                  } else {
                    navigate(`/orgs/${e.target.value}/dashboard`);
                  }
                }}
                className="w-full p-2.5 rounded-xl bg-secondary text-sm border border-border"
              >
                {orgs.length === 0 && <option value="">No Organizations</option>}
                {orgs.map((o) => (
                  <option key={o.orgId?._id} value={o.orgId?._id}>
                    {o.orgId?.name} ({o.role})
                  </option>
                ))}
                <option value="create">+ Create New Org</option>
              </select>
            </div>

            <nav className="flex-1 space-y-1 pt-4 border-t border-border">
              {activeOrg && (
                <>
                  {[
                    { to: `/orgs/${orgId}/dashboard`, icon: LayoutDashboard, label: "Dashboard" },
                    { to: `/orgs/${orgId}/projects`, icon: Folder, label: "Projects" },
                    { to: `/orgs/${orgId}/departments`, icon: Layers, label: "Departments" },
                    { to: `/orgs/${orgId}/teams`, icon: Network, label: "Teams" },
                    { to: `/orgs/${orgId}/messages`, icon: MessageCircle, label: "Messages", badge: totalDmUnread },
                    { to: `/orgs/${orgId}/analytics`, icon: BarChart2, label: "Analytics" },
                    { to: `/orgs/${orgId}/documents`, icon: BookOpen, label: "Wiki Docs" },
                    { to: `/orgs/${orgId}/activity`, icon: Activity, label: "Activity Feed" },
                    ...(isAdmin ? [{ to: `/orgs/${orgId}/settings`, icon: Settings, label: "Org Settings" }] : []),
                  ].map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl text-sm hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge > 0 && (
                        <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-[9px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-sm hover:bg-secondary border-t border-border mt-4 pt-4 text-muted-foreground hover:text-foreground"
              >
                <User className="w-4.5 h-4.5" />
                My Profile
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 p-3 rounded-xl text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4.5 h-4.5" />
                Log Out
              </button>
            </nav>
          </div>
        )}

        {/* Content Shell / Main Canvas */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          {/* Desktop Header - Glassmorphic floating-feel top header */}
          <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-border/50 bg-card/10 backdrop-blur-md relative z-10">
            <div>
              <h1 className="font-extrabold text-base tracking-tight leading-none bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                SmartPortal
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Search trigger - Premium custom design */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-secondary/35 border border-border/80 rounded-xl text-xs text-muted-foreground hover:bg-secondary/60 hover:border-primary/30 transition-all hover:shadow-sm"
                title="Search (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search features & data...</span>
                <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-background border border-border/80 rounded-lg text-[9px] font-bold text-muted-foreground/70 shadow-inner">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </button>
              <NotificationBell />
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full hover:bg-secondary/50 transition-all text-foreground/80 hover:text-foreground"
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Subpage Router View */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 transition-all bg-secondary/5">
            <Outlet context={{ refetchUser, userProfile }} />
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default AppLayout;
