import { apiSlice } from "../../services/apiSlice";

export const analyticsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrgStats: builder.query({
      query: (orgId) => `/v1/analytics/orgs/${orgId}`,
      providesTags: (result, error, orgId) => [
        { type: "Analytics", id: `ORG-${orgId}` },
      ],
    }),

    getProjectStats: builder.query({
      query: (projectId) => `/v1/analytics/projects/${projectId}`,
      providesTags: (result, error, projectId) => [
        { type: "Analytics", id: `PROJ-${projectId}` },
      ],
    }),

    getProjectWorkload: builder.query({
      query: (projectId) => `/v1/analytics/projects/${projectId}/workload`,
      providesTags: (result, error, projectId) => [
        { type: "Analytics", id: `WORKLOAD-${projectId}` },
      ],
    }),
  }),
});

export const {
  useGetOrgStatsQuery,
  useGetProjectStatsQuery,
  useGetProjectWorkloadQuery,
} = analyticsApiSlice;
