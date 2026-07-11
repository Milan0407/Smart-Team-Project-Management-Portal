import { useState, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../auth/authSlice";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  useGetBoardQuery,
  useUpdateBoardMutation,
} from "./boardApiSlice";
import { useGetProjectQuery } from "../project/projectApiSlice";
import {
  useGetTasksByBoardQuery,
  useMoveTaskMutation,
} from "../task/taskApiSlice";
import TaskCard from "../task/TaskCard";
import TaskModal from "../task/TaskModal";
import { getSocket } from "../../shared/utils/socket";
import { apiUrl } from "../../shared/config/api";
import {
  LayoutDashboard,
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Search,
  SlidersHorizontal,
  X,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";

const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") =>
  error?.data?.message || error?.message || fallback;

const BoardSkeleton = () => (
  <div className="space-y-6 h-full flex flex-col overflow-hidden">
    <div className="flex justify-between gap-4 animate-pulse">
      <div>
        <div className="h-4 w-32 rounded bg-secondary" />
        <div className="mt-3 h-7 w-56 rounded bg-secondary" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-xl bg-secondary" />
        <div className="h-9 w-24 rounded-xl bg-secondary" />
      </div>
    </div>
    <div className="h-14 rounded-2xl border border-border bg-card animate-pulse" />
    <div className="flex-1 overflow-hidden">
      <div className="flex gap-5 h-full">
        {[1, 2, 3].map((item) => (
          <div key={item} className="w-72 rounded-2xl border border-border bg-secondary/15 p-3 animate-pulse">
            <div className="h-5 w-32 rounded bg-secondary" />
            <div className="mt-5 h-24 rounded-xl bg-card" />
            <div className="mt-3 h-24 rounded-xl bg-card" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ErrorPanel = ({ title, message, onRetry, backTo }) => (
  <div className="text-center py-20 border border-destructive/20 rounded-xl bg-destructive/5">
    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
    <h3 className="font-semibold text-lg text-foreground">{title}</h3>
    <p className="text-xs text-muted-foreground mt-2">{message}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-2">
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary"
        >
          Back to Project
        </Link>
      )}
    </div>
  </div>
);

const BoardDetails = () => {
  const { orgId, projectId, boardId } = useParams();
  const token = useSelector(selectCurrentToken);
  const { userProfile } = useOutletContext();
  
  const orgs = userProfile?.data?.orgMemberships || [];
  const activeOrgMember = orgs.find((o) => o.orgId?._id === orgId);
  const userRole = activeOrgMember?.role;
  const isAdmin = userRole === "org_admin";
  const isViewer = userRole === "viewer";
  const [boardMessage, setBoardMessage] = useState(null);

  const handleExportCSV = async () => {
    setBoardMessage(null);
    try {
      const response = await fetch(apiUrl(`/v1/projects/${projectId}/tasks/export`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-${projectId}-tasks.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV Export failed:", err);
      setBoardMessage({
        type: "error",
        text: getErrorMessage(err, "Failed to export tasks to CSV."),
      });
    }
  };

  // ── Data Queries ────────────────────────────────────────────────────────
  const {
    data: boardRes,
    isLoading: boardLoading,
    isError: boardIsError,
    error: boardError,
    refetch: refetchBoard,
  } = useGetBoardQuery(boardId);

  const { data: projectRes, isError: projectIsError, error: projectError, refetch: refetchProject } = useGetProjectQuery(projectId);
  const {
    data: tasksRes,
    isLoading: tasksLoading,
    isError: tasksIsError,
    error: tasksError,
    refetch: refetchTasks,
  } = useGetTasksByBoardQuery({ boardId });

  const [updateBoard, { isLoading: isUpdating }] = useUpdateBoardMutation();
  const [moveTask] = useMoveTaskMutation();

  // Sockets subscription
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit("room:join", { projectId });

      const handleBoardUpdate = (data) => {
        console.log("Real-time board update received:", data);
        if (data.boardId === boardId) {
          refetchBoard();
          refetchTasks();
        }
      };

      socket.on("board:updated", handleBoardUpdate);

      return () => {
        socket.emit("room:leave", { projectId });
        socket.off("board:updated", handleBoardUpdate);
      };
    }
  }, [projectId, boardId, refetchBoard, refetchTasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (type === "task" && activeFilterCount > 0) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "column") {
      const reordered = [...columns];
      const [removed] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, removed);
      const updated = reordered.map((col, idx) => ({ ...col, order: idx }));

      try {
        await updateBoard({ id: boardId, columns: updated }).unwrap();
        refetchBoard();
      } catch (err) {
        console.error("Failed to reorder columns:", err);
        setBoardMessage({
          type: "error",
          text: getErrorMessage(err, "Failed to reorder columns."),
        });
      }
    } else {
      const destCol = destination.droppableId;
      try {
        await moveTask({
          id: draggableId,
          columnName: destCol,
          order: destination.index,
        }).unwrap();
        refetchTasks();
      } catch (err) {
        console.error("Failed to move task:", err);
        setBoardMessage({
          type: "error",
          text: getErrorMessage(err, "Failed to move task."),
        });
      }
    }
  };

  // ── Column Management State ──────────────────────────────────────────────
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState("#3b82f6");
  const [showColForm, setShowColForm] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [showMyTasks, setShowMyTasks] = useState(false);

  // ── Task Modal State ─────────────────────────────────────────────────────
  const [taskModal, setTaskModal] = useState(null);
  // { mode: "create"|"view", taskId?, columnName? }

  // ── Quick-add task per column ────────────────────────────────────────────
  const [quickAdd, setQuickAdd] = useState(null);
  // { columnName, title }

  const board = boardRes?.data;
  const project = projectRes?.data;
  const allTasks = tasksRes?.data || [];
  const currentUserId = userProfile?.data?._id;

  const isLead = project?.leadId === currentUserId || (project?.leadId?._id && project?.leadId?._id === currentUserId);
  const isProjectManager = isAdmin || isLead;
  const priorityOptions = ["low", "medium", "high", "critical"];
  const assignees = Array.from(
    new Map(
      allTasks
        .filter((task) => task.assigneeId)
        .map((task) => {
          const assigneeId = task.assigneeId?._id || task.assigneeId;
          return [assigneeId, task.assigneeId];
        })
    ).values()
  );
  const activeFilterCount = [
    searchTerm.trim(),
    assigneeFilter !== "all",
    priorityFilter !== "all",
    dueFilter !== "all",
    showMyTasks,
  ].filter(Boolean).length;

  const isDueToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const due = new Date(dateStr);
    return due.toDateString() === today.toDateString();
  };

  const isOverdue = (dateStr, status) => {
    if (!dateStr || ["done", "cancelled"].includes(status)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isDueThisWeek = (dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);
    const due = new Date(dateStr);
    return due >= now && due <= weekFromNow;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setAssigneeFilter("all");
    setPriorityFilter("all");
    setDueFilter("all");
    setShowMyTasks(false);
  };

  const filteredTasks = allTasks.filter((task) => {
    const assigneeId = task.assigneeId?._id || task.assigneeId;
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedQuery ||
      task.title?.toLowerCase().includes(normalizedQuery) ||
      task.description?.toLowerCase().includes(normalizedQuery);
    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "unassigned" && !assigneeId) ||
      assigneeId === assigneeFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesDue =
      dueFilter === "all" ||
      (dueFilter === "overdue" && isOverdue(task.dueDate, task.status)) ||
      (dueFilter === "today" && isDueToday(task.dueDate)) ||
      (dueFilter === "week" && isDueThisWeek(task.dueDate)) ||
      (dueFilter === "none" && !task.dueDate);
    const matchesMyTasks = !showMyTasks || assigneeId === currentUserId;

    return (
      matchesSearch &&
      matchesAssignee &&
      matchesPriority &&
      matchesDue &&
      matchesMyTasks
    );
  });

  const columns = board?.columns
    ? [...board.columns].sort((a, b) => a.order - b.order)
    : [];

  // Group tasks by column name
  const tasksByColumn = {};
  columns.forEach((col) => {
    tasksByColumn[col.name] = filteredTasks.filter(
      (t) => t.columnName === col.name && t.isActive !== false
    ).sort((a, b) => a.order - b.order);
  });

  /*
  |--------------------------------------------------------------------------
  | Column Handlers
  |--------------------------------------------------------------------------
  */
  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColName) return;

    const newColumns = [
      ...columns,
      { name: newColName, order: columns.length, color: newColColor },
    ];

    try {
      await updateBoard({ id: boardId, columns: newColumns }).unwrap();
      setNewColName("");
      setNewColColor("#3b82f6");
      setShowColForm(false);
      setBoardMessage({ type: "success", text: "Column added." });
      refetchBoard();
    } catch (err) {
      console.error(err);
      setBoardMessage({
        type: "error",
        text: getErrorMessage(err, "Failed to add column."),
      });
    }
  };

  const handleDeleteColumn = async (colIndex) => {
    if (
      !confirm(
        "Delete this column? Tasks in it will lose their column mapping."
      )
    )
      return;

    const filtered = columns.filter((_, idx) => idx !== colIndex);
    const reordered = filtered.map((col, idx) => ({ ...col, order: idx }));

    try {
      await updateBoard({ id: boardId, columns: reordered }).unwrap();
      setBoardMessage({ type: "success", text: "Column deleted." });
      refetchBoard();
    } catch (err) {
      console.error(err);
      setBoardMessage({
        type: "error",
        text: getErrorMessage(err, "Failed to delete column."),
      });
    }
  };

  const handleMoveColumn = async (colIndex, direction) => {
    if (direction === "left" && colIndex === 0) return;
    if (direction === "right" && colIndex === columns.length - 1) return;

    const targetIndex = direction === "left" ? colIndex - 1 : colIndex + 1;
    const reordered = [...columns];
    const temp = reordered[colIndex];
    reordered[colIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    const updated = reordered.map((col, idx) => ({ ...col, order: idx }));

    try {
      await updateBoard({ id: boardId, columns: updated }).unwrap();
      refetchBoard();
    } catch (err) {
      console.error(err);
      setBoardMessage({
        type: "error",
        text: getErrorMessage(err, "Failed to move column."),
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading / Not Found States
  |--------------------------------------------------------------------------
  */
  if (boardLoading) {
    return <BoardSkeleton />;
  }

  if (boardIsError) {
    return (
      <ErrorPanel
        title="Board failed to load"
        message={getErrorMessage(boardError, "We could not load this board.")}
        onRetry={refetchBoard}
        backTo={`/orgs/${orgId}/projects/${projectId}`}
      />
    );
  }

  if (!board) {
    return (
      <div className="text-center py-20 border border-dashed rounded-xl bg-card">
        <h3 className="font-bold text-lg text-destructive">Board Not Found</h3>
        <p className="text-xs text-muted-foreground mt-2">
          Verify the board ID or navigate back.
        </p>
        <Link
          to={`/orgs/${orgId}/projects/${projectId}`}
          className="text-xs text-primary underline mt-4 block"
        >
          Back to Project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden animate-fadeIn">
      {/*
      |------------------------------------------------------------------------
      | Header
      |------------------------------------------------------------------------
      */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div className="space-y-1">
          <Link
            to={`/orgs/${orgId}/projects/${projectId}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:translate-x-[-2px] transition-all font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to {project?.name || "Project"}
          </Link>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground/90">{board.name}</h2>
            <span className="text-[9px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg font-bold text-primary uppercase tracking-wider">
              Kanban
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              {filteredTasks.length} of {allTasks.length} task{allTasks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-border/80 hover:bg-secondary/60 rounded-xl text-xs font-bold transition-all text-muted-foreground"
            title="Export tasks to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {!isViewer && (
            <button
              onClick={() =>
                setTaskModal({ mode: "create", columnName: columns[0]?.name || "" })
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
          {isProjectManager && (
            <button
              onClick={() => setShowColForm(!showColForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-border/80 hover:bg-secondary/60 rounded-xl text-xs font-bold transition-all text-muted-foreground"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Column
            </button>
          )}
        </div>
      </div>

      {projectIsError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 flex-shrink-0">
          <span>{getErrorMessage(projectError, "Project information could not be loaded.")}</span>
          <button type="button" onClick={refetchProject} className="font-semibold text-primary hover:underline">
            Retry
          </button>
        </div>
      )}

      {boardMessage && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-xs flex-shrink-0 ${
            boardMessage.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
              : "border-destructive/20 bg-destructive/5 text-destructive"
          }`}
        >
          <span>{boardMessage.text}</span>
          <button
            type="button"
            onClick={() => setBoardMessage(null)}
            className="font-semibold opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {tasksIsError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex-shrink-0">
          <span>{getErrorMessage(tasksError, "Tasks could not be loaded for this board.")}</span>
          <button type="button" onClick={refetchTasks} className="font-semibold text-primary hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Task Filters */}
      <div className="flex flex-col xl:flex-row gap-3 rounded-2xl border border-border/70 bg-card/55 p-3 shadow-sm flex-shrink-0">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search task title or description"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/35 border border-border/80 text-xs outline-none focus:border-primary transition-all"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:flex gap-2">
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary/35 border border-border/80 text-xs outline-none focus:border-primary"
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee._id} value={assignee._id}>
                {assignee.name}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary/35 border border-border/80 text-xs outline-none focus:border-primary"
          >
            <option value="all">All priorities</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>

          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary/35 border border-border/80 text-xs outline-none focus:border-primary"
          >
            <option value="all">Any due date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="week">Due this week</option>
            <option value="none">No due date</option>
          </select>

          <button
            type="button"
            onClick={() => setShowMyTasks((value) => !value)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              showMyTasks
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/35 border-border/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            My Tasks
          </button>
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 bg-background text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear {activeFilterCount}
          </button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-shrink-0">
          <Info className="w-3.5 h-3.5" />
          Clear filters to reorder task cards.
        </div>
      )}

      {/* Add Column Form */}
      {isProjectManager && showColForm && (
        <form
          onSubmit={handleAddColumn}
          className="p-5 border border-border/80 rounded-2xl bg-card max-w-md space-y-4 animate-slideDown flex-shrink-0 shadow-md"
        >
          <h4 className="font-semibold text-xs border-b border-border/50 pb-1.5 uppercase tracking-wider text-muted-foreground/80">
            New Workflow Column
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
                Column Title
              </label>
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-secondary/35 border border-border/80 text-xs outline-none focus:border-primary transition-all font-medium"
                placeholder="QA Review"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider mb-1.5">
                Color tag
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newColColor}
                  onChange={(e) => setNewColColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={newColColor}
                  onChange={(e) => setNewColColor(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-secondary/35 border border-border/80 text-xs outline-none font-medium"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              Save Column
            </button>
            <button
              type="button"
              onClick={() => setShowColForm(false)}
              className="px-4 py-2 border border-border/80 hover:bg-secondary/60 text-xs rounded-xl text-muted-foreground font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/*
      |------------------------------------------------------------------------
      | Kanban Board
      |------------------------------------------------------------------------
      */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="column" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-x-auto overflow-y-hidden pb-4"
            >
              <div className="flex gap-5 h-full items-start min-w-max pr-6">
                {columns.length === 0 && (
                  <div className="w-[min(34rem,calc(100vw-4rem))] rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                    <LayoutDashboard className="w-10 h-10 text-muted-foreground/35 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold">No columns yet</h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Add a workflow column before creating task cards on this board.
                    </p>
                    {isProjectManager && (
                      <button
                        type="button"
                        onClick={() => setShowColForm(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                      >
                        <Plus className="w-4 h-4" />
                        Add Column
                      </button>
                    )}
                  </div>
                )}
                {columns.map((col, idx) => {
                  const colTasks = tasksByColumn[col.name] || [];
                  const unfilteredCount = allTasks.filter(
                    (t) => t.columnName === col.name && t.isActive !== false
                  ).length;

                  return (
                    <Draggable key={col.name} draggableId={col.name} index={idx} isDragDisabled={!isProjectManager}>
                      {(providedColumn) => (
                        <div
                          ref={providedColumn.innerRef}
                          {...providedColumn.draggableProps}
                          className="w-72 bg-secondary/15 border border-border/60 rounded-2xl flex flex-col max-h-full overflow-hidden shadow-sm"
                        >
                          {/* Column Header */}
                          <div
                            {...providedColumn.dragHandleProps}
                            className="p-3 border-b border-border/50 flex items-center justify-between gap-2 rounded-t-2xl cursor-grab active:cursor-grabbing select-none"
                            style={{ borderTop: `3px solid ${col.color || "#cbd5e1"}` }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold truncate text-foreground/80">{col.name}</span>
                              <span className="text-[10px] bg-secondary/80 border border-border/80 rounded-full px-2 py-0.5 font-semibold text-muted-foreground flex-shrink-0">
                                {colTasks.length}
                              </span>
                            </div>
                            {isProjectManager && (
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <button
                                  onClick={() => handleDeleteColumn(idx)}
                                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                  title="Delete Column"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Task Cards Droppable */}
                          <Droppable droppableId={col.name} type="task">
                            {(providedTasks, snapshot) => (
                              <div
                                ref={providedTasks.innerRef}
                                {...providedTasks.droppableProps}
                                className={`flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[150px] transition-colors duration-200 ${
                                  snapshot.isDraggingOver ? "bg-primary/5 border border-primary/20 backdrop-blur-sm" : ""
                                }`}
                              >
                                {tasksLoading && (
                                  <>
                                    <div className="h-28 rounded-2xl bg-card border border-border/70 animate-pulse" />
                                    <div className="h-24 rounded-2xl bg-card border border-border/70 animate-pulse" />
                                  </>
                                )}

                                {!tasksLoading && !tasksIsError && colTasks.length === 0 && (
                                  <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-4 text-center text-xs text-muted-foreground">
                                    {activeFilterCount > 0 && unfilteredCount > 0
                                      ? "No cards match the current filters."
                                      : "No tasks in this column."}
                                  </div>
                                )}

                                {!tasksLoading && colTasks.map((task, taskIdx) => (
                                  <Draggable key={task._id} draggableId={task._id} index={taskIdx} isDragDisabled={isViewer || activeFilterCount > 0}>
                                    {(providedTask) => (
                                      <div
                                        ref={providedTask.innerRef}
                                        {...providedTask.draggableProps}
                                        {...providedTask.dragHandleProps}
                                      >
                                        <TaskCard
                                          task={task}
                                          dragDisabledReason={
                                            isViewer
                                              ? "Viewers cannot reorder tasks."
                                              : activeFilterCount > 0
                                                ? "Clear filters to reorder."
                                                : ""
                                          }
                                          onClick={(t) =>
                                            setTaskModal({ mode: "view", taskId: t._id })
                                          }
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {providedTasks.placeholder}

                                {/* Quick-add card at bottom */}
                                {quickAdd?.columnName === col.name ? (
                                  <div className="p-3 rounded-2xl border border-primary/35 bg-primary/5 space-y-2.5">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={quickAdd.title}
                                      onChange={(e) =>
                                        setQuickAdd({ ...quickAdd, title: e.target.value })
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Escape") setQuickAdd(null);
                                        if (e.key === "Enter" && quickAdd.title.trim()) {
                                          setTaskModal({
                                            mode: "create",
                                            columnName: col.name,
                                            prefillTitle: quickAdd.title,
                                          });
                                          setQuickAdd(null);
                                        }
                                      }}
                                      placeholder="Task title... (Enter to create)"
                                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs outline-none focus:border-primary transition-all font-medium"
                                    />
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => {
                                          setTaskModal({
                                            mode: "create",
                                            columnName: col.name,
                                          });
                                          setQuickAdd(null);
                                        }}
                                        className="flex-1 py-2 bg-primary text-white text-[10px] rounded-lg font-semibold transition-all shadow-sm shadow-primary/10"
                                      >
                                        Open Form
                                      </button>
                                      <button
                                        onClick={() => setQuickAdd(null)}
                                        className="px-3 py-2 border border-border text-[10px] rounded-lg text-muted-foreground font-semibold hover:bg-secondary/65 transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : !isViewer ? (
                                  <button
                                    onClick={() =>
                                      setQuickAdd({ columnName: col.name, title: "" })
                                    }
                                    className="w-full p-2.5 rounded-xl border border-dashed border-border/80 hover:border-primary/45 hover:bg-primary/5 text-xs text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-1.5 font-semibold"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Task
                                  </button>
                                ) : null}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}

                {/* Add Column CTA */}
                {isProjectManager && (
                <div
                  onClick={() => setShowColForm(true)}
                  className="w-72 p-6 rounded-2xl border border-dashed border-border/80 bg-card/25 hover:bg-card/45 hover:border-primary/40 hover:text-primary cursor-pointer flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground transition-all duration-300 h-28 self-start shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Add Column</span>
                </div>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/*
      |------------------------------------------------------------------------
      | Task Modal Overlay
      |------------------------------------------------------------------------
      */}
      {taskModal && (
        <TaskModal
          mode={taskModal.mode}
          taskId={taskModal.taskId}
          projectId={projectId}
          orgId={orgId}
          boardId={boardId}
          columnName={taskModal.columnName}
          columns={columns}
          isProjectManager={isProjectManager}
          isViewer={isViewer}
          onClose={() => {
            setTaskModal(null);
            refetchTasks();
          }}
          onDeleted={() => refetchTasks()}
        />
      )}
    </div>
  );
};

export default BoardDetails;
