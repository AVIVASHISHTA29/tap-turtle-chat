import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQuery } from "../../app/baseQueries";

export interface Project {
  project_id: string;
  project_name: string;
  api_key: string;
  created_at: string;
}

export interface CreateProjectRequest {
  project_name: string;
}

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: authenticatedBaseQuery,
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

export const { useGetProjectsQuery, useCreateProjectMutation } = projectsApi;
