import { apiSlice } from "../../services/apiSlice";

export const dmApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Inbox ────────────────────────────────────────────────────────────
    getInbox: builder.query({
      query: () => "/v1/conversations",
      providesTags: [{ type: "Conversation", id: "INBOX" }],
    }),

    // ── Start / get conversation ─────────────────────────────────────────
    getOrCreateConversation: builder.mutation({
      query: (targetUserId) => ({
        url: "/v1/conversations",
        method: "POST",
        body: { targetUserId },
      }),
      invalidatesTags: [{ type: "Conversation", id: "INBOX" }],
    }),

    // ── Mark read ────────────────────────────────────────────────────────
    markConversationRead: builder.mutation({
      query: (conversationId) => ({
        url: `/v1/conversations/${conversationId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Conversation", id: "INBOX" },
        { type: "Conversation", id },
      ],
    }),

    // ── Messages ─────────────────────────────────────────────────────────
    getDmMessages: builder.query({
      query: ({ conversationId, cursor, limit = 50 }) => ({
        url: `/v1/conversations/${conversationId}/messages`,
        params: { ...(cursor ? { cursor } : {}), limit },
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
    }),

    sendDm: builder.mutation({
      query: ({ conversationId, content }) => ({
        url: `/v1/conversations/${conversationId}/messages`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
        { type: "Conversation", id: "INBOX" },
      ],
    }),

    editDm: builder.mutation({
      query: ({ conversationId, msgId, content }) => ({
        url: `/v1/conversations/${conversationId}/messages/${msgId}`,
        method: "PATCH",
        body: { content },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
    }),

    deleteDm: builder.mutation({
      query: ({ conversationId, msgId }) => ({
        url: `/v1/conversations/${conversationId}/messages/${msgId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversation", id: conversationId },
      ],
    }),
  }),
});

export const {
  useGetInboxQuery,
  useGetOrCreateConversationMutation,
  useMarkConversationReadMutation,
  useGetDmMessagesQuery,
  useSendDmMutation,
  useEditDmMutation,
  useDeleteDmMutation,
} = dmApiSlice;
