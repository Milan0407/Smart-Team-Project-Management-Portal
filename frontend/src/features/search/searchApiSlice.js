import { apiSlice } from "../../services/apiSlice";

export const searchApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    globalSearch: builder.query({
      query: ({ q, orgId, type = "all", limit = 10 }) => ({
        url: "/v1/search",
        params: { q, orgId, type, limit },
      }),
      // Don't cache search results — always fresh
      keepUnusedDataFor: 0,
      providesTags: [{ type: "Search", id: "GLOBAL" }],
    }),
  }),
});

export const { useGlobalSearchQuery, useLazyGlobalSearchQuery } = searchApiSlice;
