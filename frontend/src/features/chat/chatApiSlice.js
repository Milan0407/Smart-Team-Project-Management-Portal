import { apiSlice } from "../../services/apiSlice";

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Fetch paginated messages (cursor-based) ──────────────────────────
    getMessages: builder.query({
      query: ({ projectId, cursor, limit = 50 }) => ({
        url: `/v1/projects/${projectId}/messages`,
        params: {
          ...(cursor ? { cursor } : {}),
          limit,
        },
      }),
      providesTags: (result, error, { projectId }) => [
        { type: "Message", id: `PROJ-${projectId}` },
        ...(result?.data?.messages
          ? result.data.messages.map((m) => ({ type: "Message", id: m._id }))
          : []),
      ],
    }),

    // ── Send a message ───────────────────────────────────────────────────
    sendMessage: builder.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/v1/projects/${projectId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Message", id: `PROJ-${projectId}` },
      ],
    }),

    // ── Edit a message ───────────────────────────────────────────────────
    editMessage: builder.mutation({
      query: ({ projectId, id, content }) => ({
        url: `/v1/projects/${projectId}/messages/${id}`,
        method: "PATCH",
        body: { content },
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: "Message", id },
        { type: "Message", id: `PROJ-${projectId}` },
      ],
    }),

    // ── Delete a message ─────────────────────────────────────────────────
    deleteMessage: builder.mutation({
      query: ({ projectId, id }) => ({
        url: `/v1/projects/${projectId}/messages/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: "Message", id },
        { type: "Message", id: `PROJ-${projectId}` },
      ],
    }),
  }),
});

export const {
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
} = chatApiSlice;
