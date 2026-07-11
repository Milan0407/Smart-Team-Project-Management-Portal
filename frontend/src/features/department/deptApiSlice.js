import { apiSlice } from "../../services/apiSlice";

export const deptApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDepartmentsByOrg: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/departments`,
      providesTags: (result, error, orgId) => [
        { type: "Department", id: `LIST-${orgId}` },
        ...(result?.data ? result.data.map((d) => ({ type: "Department", id: d._id })) : []),
      ],
    }),
    createDepartment: builder.mutation({
      query: ({ orgId, ...deptData }) => ({
        url: `/v1/orgs/${orgId}/departments`,
        method: "POST",
        body: deptData,
      }),
      invalidatesTags: (result, error, { orgId }) => [
        { type: "Department", id: `LIST-${orgId}` },
      ],
    }),
    getDepartment: builder.query({
      query: (id) => `/v1/departments/${id}`,
      providesTags: (result, error, id) => [{ type: "Department", id }],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/v1/departments/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Department", id },
      ],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/v1/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Department", id },
        "Department", // invalidates all lists
      ],
    }),
    addDeptMember: builder.mutation({
      query: ({ id, userId, role }) => ({
        url: `/v1/departments/${id}/members`,
        method: "POST",
        body: { userId, role },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Department", id },
      ],
    }),
    removeDeptMember: builder.mutation({
      query: ({ id, uid }) => ({
        url: `/v1/departments/${id}/members/${uid}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Department", id },
      ],
    }),
    assignDeptManager: builder.mutation({
      query: ({ id, managerId }) => ({
        url: `/v1/departments/${id}/manager`,
        method: "PATCH",
        body: { managerId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Department", id },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsByOrgQuery,
  useCreateDepartmentMutation,
  useGetDepartmentQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useAddDeptMemberMutation,
  useRemoveDeptMemberMutation,
  useAssignDeptManagerMutation,
} = deptApiSlice;
