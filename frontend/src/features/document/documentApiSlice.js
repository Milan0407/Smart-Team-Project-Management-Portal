import { apiSlice } from "../../services/apiSlice";

export const documentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrgDocuments: builder.query({
      query: (orgId) => `/v1/orgs/${orgId}/documents`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: "Document", id: _id })),
              { type: "Document", id: "LIST" },
            ]
          : [{ type: "Document", id: "LIST" }],
    }),
    getProjectDocuments: builder.query({
      query: (projectId) => `/v1/projects/${projectId}/documents`,
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ _id }) => ({ type: "Document", id: _id })),
              { type: "Document", id: "LIST" },
            ]
          : [{ type: "Document", id: "LIST" }],
    }),
    getDocumentDetails: builder.query({
      query: (docId) => `/v1/documents/${docId}`,
      providesTags: (result, error, id) => [{ type: "Document", id }],
    }),
    createDocument: builder.mutation({
      query: ({ orgId, ...body }) => ({
        url: `/v1/orgs/${orgId}/documents`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),
    updateDocument: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/v1/documents/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Document", id },
        { type: "Document", id: "LIST" },
      ],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/v1/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Document", id: "LIST" }],
    }),
  }),
});

export const {
  useGetOrgDocumentsQuery,
  useGetProjectDocumentsQuery,
  useGetDocumentDetailsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
} = documentApiSlice;
