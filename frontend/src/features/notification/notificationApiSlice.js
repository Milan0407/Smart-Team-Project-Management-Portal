import { apiSlice } from "../../services/apiSlice";

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => `/v1/notifications?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: "Notification", id: _id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),
    getUnreadCount: builder.query({
      query: () => "/v1/notifications/unread-count",
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
    }),
    markAllRead: builder.mutation({
      query: () => ({
        url: "/v1/notifications/read",
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),
    markRead: builder.mutation({
      query: (id) => ({
        url: `/v1/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Notification", id },
        { type: "Notification", id: "UNREAD_COUNT" },
        { type: "Notification", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
} = notificationApiSlice;
