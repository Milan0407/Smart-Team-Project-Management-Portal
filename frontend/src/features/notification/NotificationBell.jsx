import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Bell, Check, MessageSquare, UserPlus, ShieldAlert, Award, Calendar } from "lucide-react";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
  notificationApiSlice,
} from "./notificationApiSlice";
import { getSocket } from "../../shared/utils/socket";

const TYPE_ICONS = {
  assignment: <UserPlus className="w-4 h-4 text-blue-400" />,
  comment: <MessageSquare className="w-4 h-4 text-violet-400" />,
  status_change: <Award className="w-4 h-4 text-amber-400" />,
  system: <ShieldAlert className="w-4 h-4 text-rose-400" />,
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Queries & Mutations
  const { data: countRes } = useGetUnreadCountQuery();
  const { data: listRes } = useGetNotificationsQuery({ page: 1, limit: 10 });
  const [markAllRead] = useMarkAllReadMutation();
  const [markRead] = useMarkReadMutation();

  const unreadCount = countRes?.data?.count || 0;
  const notifications = listRes?.data?.items || [];

  // Listen for socket events
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notification) => {
        // Invalidate tags to force RTK Query to refresh unread count and notification list
        dispatch(
          notificationApiSlice.util.invalidateTags([
            { type: "Notification", id: "LIST" },
            { type: "Notification", id: "UNREAD_COUNT" },
          ])
        );
      };

      socket.on("notification:received", handleNewNotification);
      return () => {
        socket.off("notification:received", handleNewNotification);
      };
    }
  }, [dispatch]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    if (!notif.isRead) {
      await markRead(notif._id).unwrap();
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-secondary transition-all duration-200 focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-background animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card/95 border border-border/80 backdrop-blur-xl rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right transition-all duration-300 scale-100 opacity-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-secondary/20">
            <span className="font-bold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium focus:outline-none"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* List Section */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/35 mb-2" />
                <p className="text-xs text-muted-foreground">All caught up!</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  You'll see alerts here when people assign tasks or leave comments.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex gap-3 p-4 hover:bg-secondary/40 cursor-pointer transition-all duration-150 relative ${
                    !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : ""
                  }`}
                >
                  {/* Unread Indicator dot */}
                  {!notif.isRead && (
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  )}

                  {/* Avatar / Icon Container */}
                  <div className="relative flex-shrink-0 ml-1.5">
                    {notif.actorId?.avatar ? (
                      <img
                        src={notif.actorId.avatar}
                        alt={notif.actorId.name}
                        className="w-9 h-9 rounded-full object-cover border border-border/50"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase">
                        {notif.actorId?.name?.substring(0, 2) || "U"}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 border border-border/50 shadow-sm flex items-center justify-center">
                      {TYPE_ICONS[notif.type] || <Calendar className="w-3 h-3 text-muted-foreground" />}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-foreground truncate">{notif.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-normal whitespace-pre-wrap break-words">
                      {notif.content}
                    </p>
                    <span className="block text-[10px] text-muted-foreground/80 mt-1">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
