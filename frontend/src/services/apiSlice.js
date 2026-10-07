import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, clearCredentials } from "../features/auth/authSlice";
import { API_BASE_URL } from "../shared/config/api";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // try to get a new token
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken) {
      try {
        const refreshResult = await baseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data && refreshResult.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = refreshResult.data.data;
          
          // store the new tokens
          api.dispatch(setCredentials({ accessToken }));
          localStorage.setItem("refreshToken", newRefreshToken);
          
          // retry the initial query
          result = await baseQuery(args, api, extraOptions);
        } else {
          localStorage.removeItem("refreshToken");
          api.dispatch(clearCredentials());
        }
      } catch (err) {
        localStorage.removeItem("refreshToken");
        api.dispatch(clearCredentials());
      }
    } else {
      api.dispatch(clearCredentials());
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Org", "Department", "Team", "Session", "Project", "Board", "Task", "Activity", "Notification", "Message", "Search", "Conversation", "Analytics", "Document", "Invitation"],
  endpoints: (builder) => ({}),
});
