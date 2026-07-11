import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../auth/authSlice";
import {
  useGetDmMessagesQuery,
  useSendDmMutation,
  useEditDmMutation,
  useDeleteDmMutation,
  useMarkConversationReadMutation,
} from "./dmApiSlice";
import { getSocket } from "../../shared/utils/socket";
import {
  ArrowLeft,
  Send,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Reply,
  X,
  ChevronDown,
  MessageCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.data?.message || error?.error || error?.message || fallback;

const ConversationErrorState = ({ message, onRetry }) => (
  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
    <AlertCircle className="mb-3 h-9 w-9 text-destructive/80" />
    <p className="text-sm font-medium text-foreground">Conversation could not load</p>
    <p className="mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mt-4 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Retry
    </button>
  </div>
);

const DmMessageSkeleton = () => (
  <div className="space-y-3 px-4 py-2">
    {[0, 1, 2, 3].map((item) => (
      <div key={item} className={`flex gap-2.5 ${item % 2 ? "flex-row-reverse" : ""}`}>
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary animate-pulse" />
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded bg-secondary animate-pulse" />
          <div className="h-9 w-48 rounded-2xl bg-secondary/70 animate-pulse" />
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
const UserInitials = ({ name, size = "md" }) => {
  const initials = name?.substring(0, 2)?.toUpperCase() || "??";
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/*
|--------------------------------------------------------------------------
| DmBubble — individual message in the conversation
|--------------------------------------------------------------------------
*/
const DmBubble = ({ message, currentUserId, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwn = (message.senderId?._id || message.senderId) === currentUserId;

  if (message.type === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-[10px] text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group flex gap-2.5 px-4 py-1 hover:bg-secondary/10 rounded-lg transition-colors ${isOwn ? "flex-row-reverse" : ""}`}
    >
      <UserInitials name={message.senderId?.name} size="sm" />

      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px] font-semibold">{message.senderId?.name}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
          {message.editedAt && (
            <span className="text-[9px] text-muted-foreground italic">(edited)</span>
          )}
        </div>

        <div
          className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-secondary/60 border border-border text-foreground rounded-tl-sm"
          } ${message.isDeleted ? "opacity-50 italic" : ""}`}
        >
          {message.isDeleted ? "This message was deleted." : message.content}
        </div>
      </div>

      {/* Action menu — own messages only */}
      {isOwn && !message.isDeleted && (
        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity relative order-first">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 py-1 bg-card border border-border rounded-lg shadow-xl z-50 w-32">
              <button
                onClick={() => { onEdit(message); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-secondary transition-all"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => { onDelete(message._id); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| DmConversation — full conversation view
|--------------------------------------------------------------------------
*/
const DmConversation = () => {
  const { orgId, conversationId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const [inputValue, setInputValue] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const {
    data: messagesRes,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetDmMessagesQuery(
    { conversationId, limit: 50 },
    { skip: !conversationId }
  );
  const [sendDm, { isLoading: isSending }] = useSendDmMutation();
  const [editDm] = useEditDmMutation();
  const [deleteDm] = useDeleteDmMutation();
  const [markRead] = useMarkConversationReadMutation();
  const [actionError, setActionError] = useState("");

  // Get other participant info
  const conversation = messagesRes?.data?.conversation;
  const otherParticipant = conversation?.participants?.find(
    (p) => (p._id || p).toString() !== currentUser?._id
  );

  // Sync messages from RTK
  useEffect(() => {
    if (messagesRes?.data?.messages) {
      setLocalMessages(messagesRes.data.messages);
    }
  }, [messagesRes]);

  // Mark conversation as read on open
  useEffect(() => {
    if (conversationId) {
      markRead(conversationId).unwrap().catch(() => {
        setActionError("Could not mark this conversation as read.");
      });
    }
  }, [conversationId, markRead]);

  // Socket: real-time DM events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ message, conversationId: msgConvId }) => {
      if (msgConvId !== conversationId) return;
      setLocalMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      if (!isAtBottom) setUnreadCount((c) => c + 1);
      // Mark as read since conversation is open
      markRead(conversationId);
    };

    const handleEdited = ({ messageId, content, editedAt }) => {
      setLocalMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, content, editedAt } : m)
      );
    };

    const handleDeleted = ({ messageId }) => {
      setLocalMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, isDeleted: true } : m)
      );
    };

    const handleTyping = ({ userId, userName, conversationId: tConvId, isTyping: typing }) => {
      if (tConvId !== conversationId) return;
      if (userId === currentUser?._id) return;
      setTypingUser(typing ? { userId, userName } : null);
    };

    socket.on("dm:message", handleNewMessage);
    socket.on("dm:message:edited", handleEdited);
    socket.on("dm:message:deleted", handleDeleted);
    socket.on("dm:typing", handleTyping);

    return () => {
      socket.off("dm:message", handleNewMessage);
      socket.off("dm:message:edited", handleEdited);
      socket.off("dm:message:deleted", handleDeleted);
      socket.off("dm:typing", handleTyping);
    };
  }, [conversationId, currentUser, isAtBottom, markRead]);

  // Auto-scroll
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages, isAtBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsAtBottom(true);
    setUnreadCount(0);
  };

  const emitTyping = (value) => {
    const socket = getSocket();
    if (!socket || !otherParticipant) return;
    if (value.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("dm:typing", {
        conversationId,
        targetUserId: otherParticipant._id || otherParticipant,
        isTyping: true,
      });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("dm:typing", {
        conversationId,
        targetUserId: otherParticipant._id || otherParticipant,
        isTyping: false,
      });
    }, 2000);
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;
    setInputValue("");
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;

    try {
      if (editingMessage) {
        await editDm({ conversationId, msgId: editingMessage._id, content }).unwrap();
        setEditingMessage(null);
      } else {
        await sendDm({ conversationId, content }).unwrap();
        setIsAtBottom(true);
      }
      setActionError("");
    } catch (err) {
      console.error("DM send error:", err);
      setActionError(getErrorMessage(err, "Could not send your message. Please try again."));
      setInputValue(content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setEditingMessage(null);
      setInputValue("");
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await deleteDm({ conversationId, msgId }).unwrap();
      setActionError("");
    } catch (err) {
      console.error("Delete failed:", err);
      setActionError(getErrorMessage(err, "Could not delete this message."));
    }
  };

  return (
    <div className="flex flex-col h-full bg-background animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card/60 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => navigate(`/orgs/${orgId}/messages`)}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
          {otherParticipant?.name?.substring(0, 2)?.toUpperCase() || "??"}
        </div>
        <div>
          <div className="font-bold text-sm leading-none">
            {otherParticipant?.name || "Loading…"}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {otherParticipant?.email || ""}
          </div>
        </div>
        {typingUser && (
          <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground italic">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            typing…
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-4 space-y-0.5"
      >
        {isLoading ? (
          <DmMessageSkeleton />
        ) : isError ? (
          <ConversationErrorState
            message={getErrorMessage(error, "Refresh and try again.")}
            onRetry={refetch}
          />
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-sm mb-1">No messages yet</p>
            <p className="text-xs text-muted-foreground">
              Say hi to {otherParticipant?.name || "your teammate"}!
            </p>
          </div>
        ) : (
          localMessages.map((msg) => (
            <DmBubble
              key={msg._id}
              message={msg}
              currentUserId={currentUser?._id}
              onEdit={(m) => { setEditingMessage(m); setInputValue(m.content); }}
              onDelete={handleDelete}
            />
          ))
        )}
        {isFetching && !isLoading && !isError && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Jump to bottom */}
      {!isAtBottom && (
        <div className="flex justify-center pb-1">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full shadow-lg hover:bg-primary/90 transition-all"
          >
            {unreadCount > 0 && <span>{unreadCount} new</span>}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Edit context bar */}
      {editingMessage && (
        <div className="mx-4 mb-1 px-3 py-1.5 bg-secondary/60 border border-border rounded-lg flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Pencil className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-primary font-semibold flex-shrink-0">Editing:</span>
            <span className="text-muted-foreground truncate">{editingMessage.content}</span>
          </div>
          <button
            onClick={() => { setEditingMessage(null); setInputValue(""); }}
            className="flex-shrink-0 p-0.5 rounded hover:bg-secondary text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        {actionError && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1">{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="rounded p-0.5 hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 bg-secondary/40 border border-border rounded-xl px-3.5 py-2.5 focus-within:border-primary transition-colors">
          <textarea
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); emitTyping(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder={
              editingMessage
                ? "Edit message…"
                : `Message ${otherParticipant?.name || "teammate"}…`
            }
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-28 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="flex-shrink-0 p-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1 text-center">
          Enter to send · Shift+Enter for new line · Esc to cancel edit
        </p>
      </div>
    </div>
  );
};

export default DmConversation;
