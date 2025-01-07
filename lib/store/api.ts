import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Project {
  project_id: string;
  project_name: string;
  api_key: string;
  created_at: string;
}

export interface CreateProjectRequest {
  project_name: string;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    credentials: "include",
  }),
  tagTypes: ["Project"],
  endpoints: (builder) => ({
    getProjects: builder.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Project"],
    }),
    createProject: builder.mutation<Project, CreateProjectRequest>({
      query: (body) => ({
        url: "projects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),
  }),
});

export const { useGetProjectsQuery, useCreateProjectMutation } = api;
