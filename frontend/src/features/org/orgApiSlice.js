import { apiSlice } from "../../services/apiSlice";

export const orgApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrg: builder.query({
      query: (id) => `/v1/orgs/${id}`,
      providesTags: (result, error, id) => [{ type: "Org", id }],
    }),
    createOrg: builder.mutation({
      query: (orgData) => ({
        url: "/v1/orgs",
        method: "POST",
        body: orgData,
      }),
      invalidatesTags: ["Org", "User"],
    }),
    updateOrg: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/v1/orgs/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Org", id },
        "User",
      ],
    }),
    getOrgMembers: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/members`,
      providesTags: (result, error, orgId) => [{ type: "Org", id: `${orgId}/members` }],
    }),
    inviteOrgMember: builder.mutation({
      query: ({ orgId, userId, role }) => ({
        url: `/v1/orgs/${orgId}/invite`,
        method: "POST",
        body: { userId, role },
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Org", id: `${orgId}/members` },
      ],
    }),
    updateOrgMemberRole: builder.mutation({
      query: ({ orgId, uid, role }) => ({
        url: `/v1/orgs/${orgId}/members/${uid}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Org", id: `${orgId}/members` },
      ],
    }),
    removeOrgMember: builder.mutation({
      query: ({ orgId, uid }) => ({
        url: `/v1/orgs/${orgId}/members/${uid}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Org", id: `${orgId}/members` },
      ],
    }),
    getOrgInvitations: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/invites`,
      providesTags: (result, error, orgId) => [{ type: "Invitation", id: `${orgId}/invites` }],
    }),
    inviteByEmail: builder.mutation({
      query: ({ orgId, email, role }) => ({
        url: `/v1/orgs/${orgId}/invites`,
        method: "POST",
        body: { email, role },
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Invitation", id: `${orgId}/invites` },
      ],
    }),
    revokeInvitation: builder.mutation({
      query: ({ orgId, invitationId }) => ({
        url: `/v1/orgs/${orgId}/invites/${invitationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Invitation", id: `${orgId}/invites` },
      ],
    }),
    acceptInvitation: builder.mutation({
      query: ({ token }) => ({
        url: "/v1/orgs/invites/accept",
        method: "POST",
        body: { token },
      }),
      invalidatesTags: ["Org", "User"],
    }),
    getInvitationDetails: builder.query({
      query: (token) => `/v1/orgs/invites/details?token=${token}`,
      providesTags: (result, error, token) => [{ type: "Invitation", id: token }],
    }),
    getOrgActivity: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/activity`,
      providesTags: (result, error, orgId) => [{ type: "Activity", id: orgId }],
    }),
    getMyPendingJoinRequest: builder.query({
      query: () => "/v1/orgs/join-requests/my-pending",
      providesTags: ["Invitation"],
    }),
    createJoinRequest: builder.mutation({
      query: (requestData) => ({
        url: "/v1/orgs/join-requests",
        method: "POST",
        body: requestData,
      }),
      invalidatesTags: ["Invitation"],
    }),
    cancelJoinRequest: builder.mutation({
      query: (requestId) => ({
        url: `/v1/orgs/join-requests/${requestId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invitation"],
    }),
    getOrgJoinRequests: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/join-requests`,
      providesTags: (result, error, orgId) => [{ type: "Invitation", id: `${orgId}/join-requests` }],
    }),
    resolveJoinRequest: builder.mutation({
      query: ({ orgId, requestId, action }) => ({
        url: `/v1/orgs/${orgId}/join-requests/${requestId}/resolve`,
        method: "PATCH",
        body: { action },
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Invitation", id: `${orgId}/join-requests` },
        { type: "Org", id: `${orgId}/members` },
        "Org",
        "User",
      ],
    }),
  }),
});

export const {
  useGetOrgQuery,
  useCreateOrgMutation,
  useUpdateOrgMutation,
  useGetOrgMembersQuery,
  useInviteOrgMemberMutation,
  useUpdateOrgMemberRoleMutation,
  useRemoveOrgMemberMutation,
  useGetOrgInvitationsQuery,
  useInviteByEmailMutation,
  useRevokeInvitationMutation,
  useAcceptInvitationMutation,
  useGetInvitationDetailsQuery,
  useGetOrgActivityQuery,
  useGetMyPendingJoinRequestQuery,
  useCreateJoinRequestMutation,
  useCancelJoinRequestMutation,
  useGetOrgJoinRequestsQuery,
  useResolveJoinRequestMutation,
} = orgApiSlice;
