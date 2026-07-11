import { apiSlice } from "../../services/apiSlice";

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Project-scoped task list (with optional filters) ──────────────────
    getTasksByProject: builder.query({
      query: ({ projectId, ...filters }) => ({
        url: `/v1/projects/${projectId}/tasks`,
        params: filters,
      }),
      providesTags: (result, error, { projectId }) => [
        { type: "Task", id: `PROJ-${projectId}` },
        ...(result?.data
          ? result.data.map((t) => ({ type: "Task", id: t._id }))
          : []),
      ],
    }),

    // ── Board-scoped task list (for Kanban rendering) ─────────────────────
    getTasksByBoard: builder.query({
      query: ({ boardId, column }) => ({
        url: `/v1/boards/${boardId}/tasks`,
        params: column ? { column } : {},
      }),
      providesTags: (result, error, { boardId }) => [
        { type: "Task", id: `BOARD-${boardId}` },
        ...(result?.data
          ? result.data.map((t) => ({ type: "Task", id: t._id }))
          : []),
      ],
    }),

    // ── Single task fetch ─────────────────────────────────────────────────
    getTask: builder.query({
      query: (id) => `/v1/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),

    // ── Create task ───────────────────────────────────────────────────────
    createTask: builder.mutation({
      query: ({ projectId, ...taskData }) => ({
        url: `/v1/projects/${projectId}/tasks`,
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: (result, error, { projectId, boardId }) => [
        { type: "Task", id: `PROJ-${projectId}` },
        ...(boardId ? [{ type: "Task", id: `BOARD-${boardId}` }] : []),
      ],
    }),

    // ── Update task ───────────────────────────────────────────────────────
    updateTask: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/v1/tasks/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        // Invalidate board cache so the card refreshes
        ...(result?.data?.boardId
          ? [{ type: "Task", id: `BOARD-${result.data.boardId}` }]
          : []),
      ],
    }),

    // ── Move task to column ───────────────────────────────────────────────
    moveTask: builder.mutation({
      query: ({ id, columnName, order }) => ({
        url: `/v1/tasks/${id}/move`,
        method: "PATCH",
        body: { columnName, order },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        ...(result?.data?.boardId
          ? [{ type: "Task", id: `BOARD-${result.data.boardId}` }]
          : []),
      ],
    }),

    // ── Delete task ───────────────────────────────────────────────────────
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/v1/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Task", id },
        "Task",
      ],
    }),

    // ── Comments ──────────────────────────────────────────────────────────
    addComment: builder.mutation({
      query: ({ taskId, content }) => ({
        url: `/v1/tasks/${taskId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    removeComment: builder.mutation({
      query: ({ taskId, commentId }) => ({
        url: `/v1/tasks/${taskId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    // ── Activity feed ─────────────────────────────────────────────────────
    getTaskActivity: builder.query({
      query: (taskId) => `/v1/tasks/${taskId}/activity`,
      providesTags: (result, error, taskId) => [
        { type: "Activity", id: taskId },
      ],
    }),

    // ── Attachments ───────────────────────────────────────────────────────
    uploadAttachment: builder.mutation({
      query: ({ taskId, formData }) => ({
        url: `/v1/tasks/${taskId}/attachments`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: "Task", id: taskId }],
    }),

    deleteAttachment: builder.mutation({
      query: ({ taskId, attachmentId }) => ({
        url: `/v1/tasks/${taskId}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: "Task", id: taskId }],
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useGetTasksByBoardQuery,
  useGetTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
  useAddCommentMutation,
  useRemoveCommentMutation,
  useGetTaskActivityQuery,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
} = taskApiSlice;
