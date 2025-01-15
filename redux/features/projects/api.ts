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

export interface ProjectInvitation {
  invitation_id: string;
  email: string;
  created_at: string;
  expires_at: string;
  status: string;
  project_name?: string;
}

export interface CreateInvitationRequest {
  email: string;
}

export interface ProjectMember {
  user_id: string;
  email: string;
  name: string;
  role: number;
  created_at: string;
}

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Project", "Invitation", "Member"],
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
    getProjectInvitations: builder.query<ProjectInvitation[], string>({
      query: (projectId) => `projects/${projectId}/invitations`,
      providesTags: ["Invitation"],
    }),
    createInvitation: builder.mutation<
      { invitationId: string },
      { projectId: string; data: CreateInvitationRequest }
    >({
      query: ({ projectId, data }) => ({
        url: `projects/${projectId}/invitations`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Invitation"],
    }),
    getInvitation: builder.query<ProjectInvitation, string>({
      query: (invitationId) => `projects/invitations/${invitationId}`,
    }),
    respondToInvitation: builder.mutation<
      void,
      { invitationId: string; action: "accept" | "reject" }
    >({
      query: ({ invitationId, action }) => ({
        url: `projects/invitations/${invitationId}`,
        method: "POST",
        body: { action },
      }),
      invalidatesTags: ["Project", "Invitation"],
    }),
    getUserInvitations: builder.query<ProjectInvitation[], void>({
      query: () => "projects/invitations/user",
      providesTags: ["Invitation"],
    }),
    getProjectMembers: builder.query<ProjectMember[], string>({
      query: (projectId) => `projects/${projectId}/members`,
      providesTags: ["Member"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectAnalyticsQuery,
  useGetProjectInvitationsQuery,
  useCreateInvitationMutation,
  useGetInvitationQuery,
  useRespondToInvitationMutation,
  useGetUserInvitationsQuery,
  useGetProjectMembersQuery,
} = projectsApi;
