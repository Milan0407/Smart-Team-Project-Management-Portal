import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../auth/authSlice";
import {
  useGetTaskQuery,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
  useAddCommentMutation,
  useRemoveCommentMutation,
  useGetTaskActivityQuery,
  useCreateTaskMutation,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
} from "./taskApiSlice";
import { useGetOrgMembersQuery } from "../org/orgApiSlice";
import { assetUrl } from "../../shared/config/api";
import {
  X,
  Flag,
  Calendar,
  User,
  MessageSquare,
  Activity,
  ArrowRight,
  Trash2,
  Plus,
  Send,
  Check,
  ChevronDown,
  AlertCircle,
  Clock,
  Edit3,
  Paperclip,
  Image,
  File,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Priority + Status Config
|--------------------------------------------------------------------------
*/
const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["todo", "in_progress", "in_review", "done", "cancelled"];

const PRIORITY_COLORS = {
  low: "bg-slate-400/15 text-slate-400 border-slate-400/30",
  medium: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  high: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  critical: "bg-rose-400/15 text-rose-400 border-rose-400/30",
};

const STATUS_COLORS = {
  todo: "bg-slate-400/15 text-slate-400",
  in_progress: "bg-blue-400/15 text-blue-400",
  in_review: "bg-violet-400/15 text-violet-400",
  done: "bg-emerald-400/15 text-emerald-400",
  cancelled: "bg-rose-400/15 text-rose-400 line-through",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ACTION_ICONS = {
  created: "✨",
  updated: "✏️",
  moved: "↔️",
  commented: "💬",
  comment_deleted: "🗑️",
  deleted: "❌",
};

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || fallback;

const TaskDetailsSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-7 w-3/4 rounded bg-secondary" />
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="h-16 rounded-lg bg-secondary/70" />
      ))}
    </div>
    <div className="h-28 rounded-lg bg-secondary/70" />
  </div>
);

const InlineError = ({ title, message, onRetry }) => (
  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-center">
    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    )}
  </div>
);

/*
|--------------------------------------------------------------------------
| TaskModal
|--------------------------------------------------------------------------
| Props:
|   mode: "create" | "view"
|   taskId: string (for view mode)
|   projectId: string
|   orgId: string
|   boardId: string (for create mode)
|   columnName: string (pre-filled column for create mode)
|   columns: array (board columns for move dropdown)
|   onClose: fn
|   onDeleted: fn (callback after delete)
*/
const TaskModal = ({
  mode = "view",
  taskId,
  projectId,
  orgId,
  boardId,
  columnName: initialColumn,
  columns = [],
  onClose,
  onDeleted,
  isProjectManager = false,
  isViewer = false,
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const commentInputRef = useRef(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const {
    data: taskRes,
    isLoading: taskLoading,
    isError: taskIsError,
    error: taskError,
    refetch: refetchTask,
  } = useGetTaskQuery(taskId, {
    skip: mode !== "view" || !taskId,
  });
  const {
    data: activityRes,
    isLoading: activityLoading,
    isError: activityIsError,
    error: activityError,
    refetch: refetchActivity,
  } = useGetTaskActivityQuery(taskId, {
    skip: mode !== "view" || !taskId,
  });
  const {
    data: membersRes,
    isLoading: membersLoading,
    isError: membersIsError,
    error: membersError,
    refetch: refetchMembers,
  } = useGetOrgMembersQuery(orgId, { skip: !orgId });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [moveTask, { isLoading: isMoving }] = useMoveTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [addComment, { isLoading: isCommenting }] = useAddCommentMutation();
  const [removeComment] = useRemoveCommentMutation();
  const [uploadAttachment, { isLoading: isUploadingFile }] = useUploadAttachmentMutation();
  const [deleteAttachment, { isLoading: isDeletingFile }] = useDeleteAttachmentMutation();

  const task = taskRes?.data;
  const activities = activityRes?.data || [];
  const members = membersRes?.data?.members || [];

  // ── Local State ────────────────────────────────────────────────────────
  const [tab, setTab] = useState("details"); // "details" | "comments" | "activity"
  const [editMode, setEditMode] = useState(mode === "create");
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");
  const [targetColumn, setTargetColumn] = useState(initialColumn || "");

  // Sync task data into form when loaded
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setAssigneeId(task.assigneeId?._id || task.assigneeId || "");
      setPriority(task.priority || "medium");
      setStatus(task.status || "todo");
      setDueDate(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
      );
      setTargetColumn(task.columnName || "");
    }
  }, [task]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Title is required");

    try {
      await createTask({
        projectId,
        title: title.trim(),
        description,
        assigneeId: assigneeId || undefined,
        priority,
        dueDate: dueDate || undefined,
        boardId: boardId || undefined,
        columnName: targetColumn || undefined,
      }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Failed to create task");
    }
  };

  const handleUpdate = async () => {
    setError(null);
    try {
      await updateTask({
        id: taskId,
        title: title.trim(),
        description,
        assigneeId: assigneeId || null,
        priority,
        status,
        dueDate: dueDate || null,
      }).unwrap();
      setEditMode(false);
    } catch (err) {
      setError(err?.data?.message || "Failed to update task");
    }
  };

  const handleMove = async (colName) => {
    setError(null);
    try {
      await moveTask({ id: taskId, columnName: colName }).unwrap();
      setTargetColumn(colName);
    } catch (err) {
      setError(err?.data?.message || "Failed to move task");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task permanently?")) return;
    try {
      await deleteTask(taskId).unwrap();
      onDeleted && onDeleted();
      onClose();
    } catch (err) {
      setError(err?.data?.message || "Failed to delete task");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({ taskId, content: commentText.trim() }).unwrap();
      setCommentText("");
    } catch (err) {
      setError(err?.data?.message || "Failed to post comment");
    }
  };

  const handleRemoveComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await removeComment({ taskId, commentId }).unwrap();
    } catch (err) {
      setError(err?.data?.message || "Failed to delete comment");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadAttachment({ taskId, formData }).unwrap();
      e.target.value = null; // reset file input
    } catch (err) {
      setError(err?.data?.message || "Failed to upload file attachment");
    }
  };

  const handleFileDelete = async (attachmentId) => {
    if (!confirm("Remove this attachment?")) return;
    setError(null);
    try {
      await deleteAttachment({ taskId, attachmentId }).unwrap();
    } catch (err) {
      setError(err?.data?.message || "Failed to delete attachment");
    }
  };

  // ── Trap backdrop click ──────────────────────────────────────────────
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {mode === "create" ? (
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                New Task
              </span>
            ) : (
              <span className="text-sm font-bold text-foreground truncate max-w-sm">
                {taskLoading ? "Loading..." : task?.title || "Task Details"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mode === "view" && task && !editMode && !isViewer && (
              <button
                onClick={() => setEditMode(true)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                title="Edit Task"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {mode === "view" && task && isProjectManager && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {membersIsError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs flex items-start justify-between gap-3 flex-shrink-0">
            <span>{getErrorMessage(membersError, "Assignee list could not be loaded.")}</span>
            <button type="button" onClick={refetchMembers} className="font-semibold text-primary hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* ── Tabs (view mode only) ── */}
        {mode === "view" && (
          <div className="flex gap-1 px-6 pt-4 flex-shrink-0 border-b border-border">
            {["details", "comments", "attachments", "activity"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg capitalize transition-all ${
                  tab === t
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {t === "comments" && `Comments (${task?.comments?.length || 0})`}
                {t === "attachments" && `Attachments (${task?.attachments?.length || 0})`}
                {t === "activity" && "Activity"}
                {t === "details" && "Details"}
              </button>
            ))}
          </div>
        )}

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {mode === "view" && taskIsError && tab !== "details" && (
            <InlineError
              title="Task failed to load"
              message={getErrorMessage(taskError, "We could not load this task.")}
              onRetry={refetchTask}
            />
          )}

          {/* ──────────────── CREATE MODE ──────────────── */}
          {mode === "create" && (
            <form onSubmit={handleCreate} className="space-y-4" id="create-task-form">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Implement authentication flow..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={5000}
                  rows={4}
                  className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="Task details, acceptance criteria, notes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    disabled={membersLoading || membersIsError}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all"
                  >
                    <option value="">— Unassigned —</option>
                    {members.map((m) => (
                      <option key={m.userId?._id} value={m.userId?._id}>
                        {m.userId?.name}
                      </option>
                    ))}
                  </select>
                </div>

                {columns.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Column
                    </label>
                    <select
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all"
                    >
                      <option value="">— No Column —</option>
                      {columns.map((col) => (
                        <option key={col.name} value={col.name}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ──────────────── VIEW: DETAILS TAB ──────────────── */}
          {mode === "view" && tab === "details" && (
            <div className="space-y-5">
              {taskLoading ? (
                <TaskDetailsSkeleton />
              ) : taskIsError ? (
                <InlineError
                  title="Task failed to load"
                  message={getErrorMessage(taskError, "We could not load this task.")}
                  onRetry={refetchTask}
                />
              ) : task ? (
                <>
                  {/* Title */}
                  {editMode ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 text-lg font-bold rounded-lg bg-secondary/50 border border-border outline-none focus:border-primary transition-all"
                    />
                  ) : (
                    <h2 className="text-lg font-bold leading-snug">{task.title}</h2>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Priority */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Priority</label>
                      {editMode ? (
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs outline-none"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-lg border ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status</label>
                      {editMode ? (
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs outline-none"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-lg ${STATUS_COLORS[task.status]}`}>
                          {task.status?.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    {/* Assignee */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Assignee</label>
                      {editMode ? (
                        <select
                          value={assigneeId}
                          onChange={(e) => setAssigneeId(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs outline-none"
                        >
                          <option value="">— Unassigned —</option>
                          {members.map((m) => (
                            <option key={m.userId?._id} value={m.userId?._id}>
                              {m.userId?.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs">
                          {task.assigneeId ? (
                            <>
                              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                {task.assigneeId.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-medium">{task.assigneeId.name}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Due Date</label>
                      {editMode ? (
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs outline-none"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Reporter</label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold">
                        {task.reporterId?.name?.substring(0, 2).toUpperCase() || "?"}
                      </div>
                      <span className="text-muted-foreground">{task.reporterId?.name || "Unknown"}</span>
                    </div>
                  </div>

                  {/* Move to Column (non-edit mode) */}
                  {!editMode && !isViewer && columns.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Move to Column
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {columns.map((col) => (
                          <button
                            key={col.name}
                            onClick={() => handleMove(col.name)}
                            disabled={isMoving || task.columnName === col.name}
                            style={{ borderColor: col.color + "40" }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                              task.columnName === col.name
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            }`}
                          >
                            {task.columnName === col.name && <Check className="w-3 h-3 inline mr-1" />}
                            {col.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Description</label>
                    {editMode ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        maxLength={5000}
                        className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all resize-none"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {task.description || "No description provided."}
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ──────────────── VIEW: COMMENTS TAB ──────────────── */}
          {mode === "view" && tab === "comments" && (
            <div className="space-y-4">
              {task?.comments?.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No comments yet. Be the first!
                </div>
              ) : (
                <div className="space-y-3">
                  {[...(task?.comments || [])]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map((comment) => {
                      const isOwn =
                        comment.authorId?._id === currentUser?._id ||
                        comment.authorId === currentUser?._id;
                      return (
                        <div
                          key={comment._id}
                          className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                {comment.authorId?.name?.substring(0, 2).toUpperCase() || "?"}
                              </div>
                              <span className="text-xs font-semibold">
                                {comment.authorId?.name || "User"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(comment.createdAt)}
                              </span>
                            </div>
                            {isOwn && !isViewer && (
                              <button
                                onClick={() => handleRemoveComment(comment._id)}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed pl-8 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Comment Input */}
              {!isViewer && (
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-border">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={2}
                  placeholder="Add a comment..."
                  maxLength={2000}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary transition-all resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      handleAddComment(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isCommenting || !commentText.trim()}
                  className="px-3 py-2 bg-primary hover:bg-primary/95 text-white rounded-lg transition-all disabled:opacity-50 self-end"
                >
                  <Send className="w-4 h-4" />
                </button>
                </form>
              )}
              {!isViewer && <p className="text-[10px] text-muted-foreground">Ctrl+Enter to submit</p>}
            </div>
          )}

          {/* ──────────────── VIEW: ACTIVITY TAB ──────────────── */}
          {mode === "view" && tab === "activity" && (
            <div className="space-y-2">
              {activityLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-12 rounded-lg bg-secondary/70" />
                  <div className="h-12 rounded-lg bg-secondary/70" />
                  <div className="h-12 rounded-lg bg-secondary/70" />
                </div>
              ) : activityIsError ? (
                <InlineError
                  title="Activity failed to load"
                  message={getErrorMessage(activityError, "We could not load task activity.")}
                  onRetry={refetchActivity}
                />
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No activity yet.
                </div>
              ) : (
                activities.map((act) => (
                  <div
                    key={act._id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-all"
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">
                      {ACTION_ICONS[act.action] || "•"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-semibold">{act.actorId?.name || "User"}</span>
                        {" "}
                        <span className="text-muted-foreground">{act.action.replace("_", " ")}</span>
                        {act.meta?.from && act.meta?.to && (
                          <span className="text-muted-foreground">
                            {" "}from <span className="font-medium text-foreground">{act.meta.from}</span>
                            {" "}to <span className="font-medium text-foreground">{act.meta.to}</span>
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(act.createdAt)} {formatTime(act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ──────────────── VIEW: ATTACHMENTS TAB ──────────────── */}
          {mode === "view" && tab === "attachments" && (
            <div className="space-y-4 animate-fadeIn">
              {/* File upload widget */}
              {!isViewer && (
                <div className="border border-border border-dashed p-6 rounded-xl text-center space-y-3 bg-secondary/10">
                <Paperclip className="w-8 h-8 text-primary mx-auto opacity-60" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Upload task files </span>
                  <span className="text-muted-foreground">or assets (Max 10MB)</span>
                </div>
                <input
                  type="file"
                  id="task-file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploadingFile}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("task-file-upload").click()}
                  disabled={isUploadingFile}
                  className="px-3.5 py-1.5 bg-secondary border border-border hover:bg-secondary/80 text-xs font-semibold rounded-lg transition-all"
                >
                  {isUploadingFile ? "Uploading File..." : "Select File"}
                </button>
              </div>
            )}

              {/* Attachments grid list */}
              {task?.attachments?.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  No attachments uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {task?.attachments?.map((att) => {
                    const isImage = att.mimeType?.startsWith("image/");
                    const downloadUrl = assetUrl(att.path);
                    return (
                      <div
                        key={att._id}
                        className="flex items-center justify-between p-3 border border-border rounded-xl bg-secondary/20 hover:bg-secondary/35 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0 overflow-hidden bg-secondary/10">
                            {isImage ? (
                              <img
                                src={downloadUrl}
                                alt={att.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : att.mimeType?.includes("pdf") ? (
                              <FileText className="w-5 h-5 text-red-500" />
                            ) : att.mimeType?.includes("zip") || att.mimeType?.includes("rar") ? (
                              <File className="w-5 h-5 text-amber-500" />
                            ) : (
                              <File className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-foreground max-w-[120px]" title={att.name}>
                              {att.name}
                            </div>
                            <div className="text-[9px] text-muted-foreground">
                              {formatBytes(att.size)} • By {att.uploadedBy?.name || "User"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <a
                            href={downloadUrl}
                            download={att.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                            title="Download Attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {!isViewer && (
                            <button
                              onClick={() => handleFileDelete(att._id)}
                              disabled={isDeletingFile}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                              title="Remove Attachment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-card/50 flex-shrink-0">
          {mode === "create" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border hover:bg-secondary text-xs rounded-lg text-muted-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-task-form"
                disabled={isCreating}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create Task"}
              </button>
            </>
          )}

          {mode === "view" && editMode && (
            <>
              <button
                onClick={() => { setEditMode(false); }}
                className="px-4 py-2 border border-border hover:bg-secondary text-xs rounded-lg text-muted-foreground transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-60"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

          {mode === "view" && !editMode && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border hover:bg-secondary text-xs rounded-lg text-muted-foreground transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
