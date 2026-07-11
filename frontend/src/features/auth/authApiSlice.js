import { apiSlice } from "../../services/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
    }),
    logout: builder.mutation({
      query: (refreshToken) => ({
        url: "/auth/logout",
        method: "POST",
        body: refreshToken ? { refreshToken } : {},
      }),
      invalidatesTags: ["Session"],
    }),
    getCurrentUser: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    changePassword: builder.mutation({
      query: (passwords) => ({
        url: "/auth/me/password",
        method: "PUT",
        body: passwords,
      }),
    }),
    getSessions: builder.query({
      query: () => "/auth/sessions",
      providesTags: ["Session"],
    }),
    revokeSession: builder.mutation({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),
    searchUserByEmail: builder.query({
      query: (email) => `/auth/users/search?email=${email}`,
    }),
    updateNotificationSettings: builder.mutation({
      query: (settings) => ({
        url: "/auth/me/notification-settings",
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useLazySearchUserByEmailQuery,
  useUpdateNotificationSettingsMutation,
} = authApiSlice;
