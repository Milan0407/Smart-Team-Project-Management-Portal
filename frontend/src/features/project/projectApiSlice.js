import { apiSlice } from "../../services/apiSlice";

export const projectApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjectsByOrg: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/projects`,
      providesTags: (result, error, orgId) => [
        { type: "Project", id: `LIST-${orgId}` },
        ...(result?.data ? result.data.map((p) => ({ type: "Project", id: p._id })) : []),
      ],
    }),
    createProject: builder.mutation({
      query: ({ orgId, ...projectData }) => ({
        url: `/v1/orgs/${orgId}/projects`,
        method: "POST",
        body: projectData,
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Project", id: `LIST-${orgId}` },
      ],
    }),
    getProject: builder.query({
      query: (id) => `/v1/projects/${id}`,
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/v1/projects/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Project", id }],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/v1/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Project", id },
        "Project", // Invalidate all lists
      ],
    }),
    getProjectMembers: builder.query({
      query: (id) => `/v1/projects/${id}/members`,
      providesTags: (result, error, id) => [{ type: "Project", id: `${id}-members` }],
    }),
    addProjectMember: builder.mutation({
      query: ({ id, userId, role }) => ({
        url: `/v1/projects/${id}/members`,
        method: "POST",
        body: { userId, role },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: `${id}-members` },
      ],
    }),
    updateProjectMemberRole: builder.mutation({
      query: ({ id, uid, role }) => ({
        url: `/v1/projects/${id}/members/${uid}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: `${id}-members` },
      ],
    }),
    removeProjectMember: builder.mutation({
      query: ({ id, uid }) => ({
        url: `/v1/projects/${id}/members/${uid}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: `${id}-members` },
      ],
    }),
  }),
});

export const {
  useGetProjectsByOrgQuery,
  useCreateProjectMutation,
  useGetProjectQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectMembersQuery,
  useAddProjectMemberMutation,
  useUpdateProjectMemberRoleMutation,
  useRemoveProjectMemberMutation,
} = projectApiSlice;
