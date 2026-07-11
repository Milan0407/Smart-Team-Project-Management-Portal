import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../auth/authSlice";
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} from "./chatApiSlice";
import { getSocket } from "../../shared/utils/socket";
import {
  MessageSquare,
  X,
  Send,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Reply,
  Loader2,
  Hash,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.data?.message || error?.error || error?.message || fallback;

const ChatErrorState = ({ message, onRetry }) => (
  <div className="mx-3 my-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-center">
    <AlertCircle className="mx-auto mb-2 h-5 w-5 text-destructive" />
    <p className="text-xs font-medium text-foreground">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="mx-auto mt-3 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary"
    >
      <RefreshCw className="h-3 w-3" />
      Retry
    </button>
  </div>
);

const ChatMessageSkeleton = () => (
  <div className="space-y-3 px-3 py-2">
    {[0, 1, 2].map((item) => (
      <div key={item} className={`flex gap-2.5 ${item % 2 ? "flex-row-reverse" : ""}`}>
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary animate-pulse" />
        <div className={`space-y-2 ${item % 2 ? "items-end" : ""}`}>
          <div className="h-2.5 w-24 rounded bg-secondary animate-pulse" />
          <div className="h-9 w-44 rounded-2xl bg-secondary/70 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

/*
|--------------------------------------------------------------------------
| MessageBubble — individual chat message
|--------------------------------------------------------------------------
*/
const MessageBubble = ({ message, currentUserId, onEdit, onDelete, onReply }) => {
  const [showActions, setShowActions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwn = message.senderId?._id === currentUserId || message.senderId === currentUserId;
  const sender = message.senderId;
  const initials = sender?.name?.substring(0, 2)?.toUpperCase() || "??";

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
      className={`group flex gap-2.5 px-3 py-1 hover:bg-secondary/20 rounded-lg transition-colors ${
        isOwn ? "flex-row-reverse" : ""
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setMenuOpen(false); }}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white flex-shrink-0 mt-0.5 ${
          isOwn ? "bg-primary" : "bg-violet-500"
        }`}
      >
        {initials}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender + time */}
        <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px] font-semibold text-foreground">{sender?.name || "Unknown"}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
          {message.editedAt && (
            <span className="text-[9px] text-muted-foreground italic">(edited)</span>
          )}
        </div>

        {/* Reply preview */}
        {message.replyTo && !message.replyTo.isDeleted && (
          <div className="mb-1 px-2 py-1 border-l-2 border-primary/40 bg-secondary/40 rounded-r text-[10px] text-muted-foreground max-w-full truncate">
            <span className="font-semibold">{message.replyTo.senderId?.name}: </span>
            {message.replyTo.content}
          </div>
        )}

        {/* Content */}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-secondary/60 border border-border text-foreground rounded-tl-sm"
          } ${message.isDeleted ? "opacity-50 italic" : ""}`}
        >
          {message.isDeleted ? "This message was deleted." : message.content}
        </div>
      </div>

      {/* Action buttons (hover) */}
      {!message.isDeleted && showActions && (
        <div
          className={`flex items-center gap-0.5 self-center opacity-0 group-hover:opacity-100 transition-opacity relative ${
            isOwn ? "order-first" : ""
          }`}
        >
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          {isOwn && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                title="More"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className={`absolute bottom-full mb-1 py-1 bg-card border border-border rounded-lg shadow-lg z-50 w-32 ${isOwn ? "right-0" : "left-0"}`}>
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
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| ChatPanel — Collapsible project chat sidebar
|--------------------------------------------------------------------------
*/
const ChatPanel = ({ projectId, projectName }) => {
  const currentUser = useSelector(selectCurrentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [localMessages, setLocalMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // RTK Query
  const {
    data: messagesRes,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetMessagesQuery(
    { projectId, limit: 50 },
    { skip: !projectId || !isOpen }
  );
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [editMessage] = useEditMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [actionError, setActionError] = useState("");

  // Sync RTK messages into local state
  useEffect(() => {
    if (messagesRes?.data?.messages) {
      setLocalMessages(messagesRes.data.messages);
    }
  }, [messagesRes]);

  // Socket real-time
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isOpen) return;

    const handleNewMessage = ({ message }) => {
      if (message.projectId?.toString() !== projectId &&
          message.projectId !== projectId) return;

      setLocalMessages((prev) => {
        // Prevent duplicate
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });

      if (!isAtBottom) {
        setUnreadCount((c) => c + 1);
      }
    };

    const handleMessageEdited = ({ messageId, content, editedAt }) => {
      setLocalMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, content, editedAt } : m)
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setLocalMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, isDeleted: true } : m)
      );
    };

    const handleTyping = ({ userId, userName, isTyping }) => {
      if (userId === currentUser?._id) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.some((u) => u.userId === userId)
            ? prev
            : [...prev, { userId, userName }];
        } else {
          return prev.filter((u) => u.userId !== userId);
        }
      });
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:message:edited", handleMessageEdited);
    socket.on("chat:message:deleted", handleMessageDeleted);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:message:edited", handleMessageEdited);
      socket.off("chat:message:deleted", handleMessageDeleted);
      socket.off("chat:typing", handleTyping);
    };
  }, [isOpen, projectId, currentUser, isAtBottom]);

  // Auto-scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [localMessages, isAtBottom]);

  // Clear unread when panel opens / scrolls to bottom
  useEffect(() => {
    if (isOpen && isAtBottom) setUnreadCount(0);
  }, [isOpen, isAtBottom]);

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

  // Typing indicator emission
  const emitTyping = (value) => {
    const socket = getSocket();
    if (!socket) return;

    if (value.trim() && !isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("chat:typing", { projectId, isTyping: true });
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("chat:typing", { projectId, isTyping: false });
    }, 2000);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    emitTyping(e.target.value);
  };

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setInputValue("");

    // Stop typing indicator immediately
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    getSocket()?.emit("chat:typing", { projectId, isTyping: false });

    try {
      if (editingMessage) {
        await editMessage({ projectId, id: editingMessage._id, content }).unwrap();
        setEditingMessage(null);
      } else {
        await sendMessage({
          projectId,
          content,
          replyTo: replyTo?._id || undefined,
        }).unwrap();
        setReplyTo(null);
        setIsAtBottom(true);
      }
      setActionError("");
    } catch (err) {
      console.error("Chat error:", err);
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
      setReplyTo(null);
      setInputValue("");
    }
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setInputValue(message.content);
    setReplyTo(null);
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage({ projectId, id: messageId }).unwrap();
      setActionError("");
    } catch (err) {
      console.error("Delete failed:", err);
      setActionError(getErrorMessage(err, "Could not delete this message."));
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setEditingMessage(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 border-b border-border text-sm font-semibold transition-all w-full hover:bg-secondary/40 ${
          isOpen ? "bg-secondary/30" : ""
        }`}
      >
        <Hash className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left">Project Chat</span>
        {unreadCount > 0 && !isOpen && (
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
            {unreadCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-3 space-y-0.5"
          >
            {isLoading ? (
              <ChatMessageSkeleton />
            ) : isError ? (
              <ChatErrorState
                message={getErrorMessage(error, "Could not load project chat.")}
                onRetry={refetch}
              />
            ) : localMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No messages yet</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Be the first to message your team!
                </p>
              </div>
            ) : (
              localMessages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  currentUserId={currentUser?._id}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReply={handleReply}
                />
              ))
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-[10px] text-muted-foreground italic">
                  {typingUsers.map((u) => u.userName).join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing…
                </span>
              </div>
            )}
            {isFetching && !isLoading && !isError && (
              <div className="flex justify-center py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Jump to bottom button */}
          {!isAtBottom && (
            <div className="flex justify-center pb-1 pt-0.5">
              <button
                onClick={scrollToBottom}
                className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                {unreadCount > 0 && <span>{unreadCount} new</span>}
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Context Bar: Reply / Edit */}
          {(editingMessage || replyTo) && (
            <div className="mx-3 mb-1 px-3 py-1.5 bg-secondary/60 border border-border rounded-lg flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 overflow-hidden">
                {editingMessage ? (
                  <>
                    <Pencil className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-primary font-semibold flex-shrink-0">Editing:</span>
                  </>
                ) : (
                  <>
                    <Reply className="w-3 h-3 text-violet-400 flex-shrink-0" />
                    <span className="text-violet-400 font-semibold flex-shrink-0">Replying to {replyTo?.senderId?.name}:</span>
                  </>
                )}
                <span className="text-muted-foreground truncate">
                  {editingMessage?.content || replyTo?.content}
                </span>
              </div>
              <button
                onClick={() => { setEditingMessage(null); setReplyTo(null); setInputValue(""); }}
                className="flex-shrink-0 p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
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
            <div className="flex items-end gap-2 bg-secondary/40 border border-border rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  editingMessage
                    ? "Edit message…"
                    : `Message #${projectName?.toLowerCase()?.replace(/\s+/g, "-") || "general"}…`
                }
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-28 leading-relaxed"
                style={{ minHeight: "20px" }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="flex-shrink-0 p-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 text-center">
              Enter to send · Shift+Enter for new line · Esc to cancel
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;
