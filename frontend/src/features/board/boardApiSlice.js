import { apiSlice } from "../../services/apiSlice";

export const boardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBoardsByProject: builder.query({
      query: (projectId) => `/v1/projects/${projectId}/boards`,
      providesTags: (result, error, projectId) => [
        { type: "Board", id: `LIST-${projectId}` },
        ...(result?.data ? result.data.map((b) => ({ type: "Board", id: b._id })) : []),
      ],
    }),
    createBoard: builder.mutation({
      query: ({ projectId, ...boardData }) => ({
        url: `/v1/projects/${projectId}/boards`,
        method: "POST",
        body: boardData,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Board", id: `LIST-${projectId}` },
      ],
    }),
    getBoard: builder.query({
      query: (id) => `/v1/boards/${id}`,
      providesTags: (result, error, id) => [{ type: "Board", id }],
    }),
    updateBoard: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/v1/boards/${id}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Board", id }],
    }),
    deleteBoard: builder.mutation({
      query: (id) => ({
        url: `/v1/boards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Board", id },
        "Board", // Invalidate lists
      ],
    }),
  }),
});

export const {
  useGetBoardsByProjectQuery,
  useCreateBoardMutation,
  useGetBoardQuery,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
} = boardApiSlice;
