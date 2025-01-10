import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQuery } from "../../app/baseQueries";

export interface Project {
  project_id: string;
  project_name: string;
  project_url: string;
  api_key: string;
  created_at: string;
}

export interface CreateProjectRequest {
  project_name: string;
  project_url: string;
}

export interface ProjectAnalytics {
  events: Array<{
    event_type: string;
    count: number;
  }>;
  timeSeries: Array<{
    hour: string;
    event_type: string;
    count: number;
  }>;
  clicks: Array<{
    css_selector: string;
    count: number;
    last_metadata: string;
  }>;
  sessions: {
    total_sessions: number;
    avg_viewport_width: number;
    avg_viewport_height: number;
    sessions_last_24h: number;
    sessions_last_7d: number;
  };
  browsers: Array<{
    browser: string;
    count: number;
  }>;
  pageViews: Array<{
    page_url: string;
    views: number;
    avg_duration: number;
    unique_visitors: number;
  }>;
  hourlyPattern: Array<{
    hour: number;
    count: number;
  }>;
}

export interface UpdateProjectRequest {
  project_name?: string;
  project_url?: string;
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
    updateProject: builder.mutation<
      Project,
      { projectId: string; data: UpdateProjectRequest }
    >({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Project"],
    }),
    deleteProject: builder.mutation<void, string>({
      query: (projectId) => ({
        url: `projects/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),
    getProjectAnalytics: builder.query<ProjectAnalytics, string>({
      query: (projectId) => `projects/${projectId}/analytics`,
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectAnalyticsQuery,
} = projectsApi;
