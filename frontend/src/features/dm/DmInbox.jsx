import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { selectCurrentUser } from "../auth/authSlice";
import {
  useGetInboxQuery,
  useGetOrCreateConversationMutation,
} from "./dmApiSlice";
import { useGetOrgMembersQuery } from "../org/orgApiSlice";
import { getSocket } from "../../shared/utils/socket";
import DmConversation from "./DmConversation";
import {
  MessageCircle,
  Search,
  Plus,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.data?.message || error?.error || error?.message || fallback;

const RetryState = ({ title, message, onRetry }) => (
  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
    <AlertCircle className="mb-3 h-8 w-8 text-destructive/80" />
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    )}
  </div>
);

const ConversationSkeleton = () => (
  <div className="space-y-1 p-2">
    {[0, 1, 2, 3].map((item) => (
      <div key={item} className="flex items-center gap-3 rounded-lg px-2 py-3">
        <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-28 rounded bg-secondary animate-pulse" />
          <div className="h-2.5 w-40 rounded bg-secondary/70 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
};

const getId = (value) => (value?._id || value || "").toString();

const UserInitials = ({ name, size = "md" }) => {
  const initials = name?.substring(0, 2)?.toUpperCase() || "??";
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| NewDmModal — search org members to start a conversation
|--------------------------------------------------------------------------
*/
const NewDmModal = ({ orgId, onClose, onStart }) => {
  const [query, setQuery] = useState("");
  const {
    data: membersRes,
    isLoading: membersLoading,
    isError: membersError,
    error: membersErrorData,
    refetch: refetchMembers,
  } = useGetOrgMembersQuery(orgId, { skip: !orgId });
  const [getOrCreate, { isLoading }] = useGetOrCreateConversationMutation();
  const currentUser = useSelector(selectCurrentUser);
  const [startError, setStartError] = useState("");

  const orgMembers = membersRes?.data?.members || [];
  const displayMembers = orgMembers.filter((m) => getId(m.userId) !== getId(currentUser?._id));
  const filteredMembers = displayMembers.filter((m) =>
    (m.userId?.name || "").toLowerCase().includes(query.toLowerCase()) ||
    (m.userId?.email || "").toLowerCase().includes(query.toLowerCase())
  );

  const handleStart = async (targetUserId) => {
    try {
      const res = await getOrCreate(targetUserId).unwrap();
      setStartError("");
      onStart(res.data._id);
      onClose();
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setStartError(getErrorMessage(err, "Could not start this conversation."));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-sm">New Direct Message</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 bg-secondary/40 border border-border rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {membersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : membersError ? (
            <RetryState
              title="Members could not load"
              message={getErrorMessage(membersErrorData, "Refresh and try again.")}
              onRetry={refetchMembers}
            />
          ) : displayMembers.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs font-medium text-muted-foreground">No teammates available</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                Add or invite another user to this organization before starting a direct message.
              </p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No members match your search
            </div>
          ) : (
            filteredMembers.map((m) => {
              const user = m.userId;
              if (!user) return null;
              return (
                <button
                  key={getId(user)}
                  onClick={() => handleStart(getId(user))}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/60 transition-all text-left"
                >
                  <UserInitials name={user.name} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{user.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <span className="ml-auto text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded capitalize">{m.role}</span>
                </button>
              );
            })
          )}
        </div>
        {startError && (
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1">{startError}</span>
            <button type="button" onClick={() => setStartError("")} className="rounded p-0.5 hover:bg-destructive/10">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| DmInbox — main conversations list
|--------------------------------------------------------------------------
*/
const DmInbox = () => {
  const { orgId, conversationId: activeId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [showNewDm, setShowNewDm] = useState(false);
  const [localConversations, setLocalConversations] = useState([]);

  const { data: inboxRes, isLoading, isFetching, isError, error, refetch } = useGetInboxQuery();

  useEffect(() => {
    if (inboxRes?.data?.conversations) {
      setLocalConversations(inboxRes.data.conversations);
    }
  }, [inboxRes]);

  // Real-time: refresh inbox when a new DM arrives
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = ({ conversationId }) => {
      refetch();
    };
    socket.on("dm:message", handler);
    return () => socket.off("dm:message", handler);
  }, [refetch]);

  const getOtherParticipant = (conversation) => {
    return conversation.participants?.find(
      (p) => (p._id || p) !== currentUser?._id && p._id !== currentUser?._id
    );
  };

  const getUnreadCount = (conversation) => {
    if (!currentUser?._id) return 0;
    return conversation.unreadCounts?.[currentUser._id] || 0;
  };

  const totalUnread = inboxRes?.data?.totalUnread || 0;

  return (
    <div className="flex h-full gap-0 animate-fadeIn">
      {/* ── Sidebar: Conversation List ── */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card/40 h-full">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-sm">Messages</h2>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNewDm(true)}
            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all"
            title="New Message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <ConversationSkeleton />
          ) : isError ? (
            <RetryState
              title="Messages could not load"
              message={getErrorMessage(error, "Check your connection and try again.")}
              onRetry={refetch}
            />
          ) : localConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click + to message a teammate</p>
            </div>
          ) : (
            localConversations.map((conv) => {
              const other = getOtherParticipant(conv);
              const unread = getUnreadCount(conv);
              const isActive = conv._id === activeId;

              return (
                <button
                  key={conv._id}
                  onClick={() => navigate(`/orgs/${orgId}/messages/${conv._id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-all text-left border-b border-border/40 ${
                    isActive ? "bg-primary/8 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="relative">
                    <UserInitials name={other?.name} size="sm" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-semibold truncate ${unread > 0 ? "text-foreground" : "text-foreground/80"}`}>
                        {other?.name || "Unknown"}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatRelativeTime(conv.lastMessage?.createdAt)}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate ${unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
          {isFetching && !isLoading && !isError && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Empty state or conversation ── */}
      {!activeId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">Your Messages</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Send private messages to teammates. Select a conversation or start a new one.
          </p>
          <button
            onClick={() => setShowNewDm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Message
          </button>
        </div>
      ) : (
        <div className="flex-1 min-w-0 h-full">
          <DmConversation />
        </div>
      )}

      {/* New DM Modal */}
      {showNewDm && (
        <NewDmModal
          orgId={orgId}
          onClose={() => setShowNewDm(false)}
          onStart={(id) => navigate(`/orgs/${orgId}/messages/${id}`)}
        />
      )}
    </div>
  );
};

export default DmInbox;
