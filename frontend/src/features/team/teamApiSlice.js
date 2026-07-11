import { apiSlice } from "../../services/apiSlice";

export const teamApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeamsByOrg: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/teams`,
      providesTags: (result, error, orgId) => [
        { type: "Team", id: `LIST-${orgId}` },
        ...(result?.data ? result.data.map((t) => ({ type: "Team", id: t._id })) : []),
      ],
    }),
    createTeam: builder.mutation({
      query: ({ orgId, ...teamData }) => ({
        url: `/v1/orgs/${orgId}/teams`,
        method: "POST",
        body: teamData,
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Team", id: `LIST-${orgId}` },
      ],
    }),
    getTeam: builder.query({
      query: (id) => `/v1/teams/${id}`,
      providesTags: (result, error, id) => [{ type: "Team", id }],
    }),
    updateTeam: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/v1/teams/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Team", id }],
    }),
    deleteTeam: builder.mutation({
      query: (id) => ({
        url: `/v1/teams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Team", id },
        "Team", // invalidates all lists
      ],
    }),
    addTeamMember: builder.mutation({
      query: ({ id, userId, role }) => ({
        url: `/v1/teams/${id}/members`,
        method: "POST",
        body: { userId, role },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Team", id }],
    }),
    removeTeamMember: builder.mutation({
      query: ({ id, uid }) => ({
        url: `/v1/teams/${id}/members/${uid}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Team", id }],
    }),
    assignTeamLead: builder.mutation({
      query: ({ id, leadId }) => ({
        url: `/v1/teams/${id}/lead`,
        method: "PATCH",
        body: { leadId },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Team", id }],
    }),
  }),
});

export const {
  useGetTeamsByOrgQuery,
  useCreateTeamMutation,
  useGetTeamQuery,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useAssignTeamLeadMutation,
} = teamApiSlice;
