import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQuery } from "../../app/baseQueries";

export interface ObservabilitySession {
  session_id: string;
  project_id: string;
  start_timestamp: string;
  user_agent: string | null;
  referrer: string | null;
}

export interface ObservabilityEvent {
  event_id: string;
  session_id: string;
  project_id: string;
  event_type: string;
  method: string;
  url: string;
  status: number;
  headers: string;
  body: string;
  payload: string;
  timestamp: string;
}

export interface ObservabilityResponse {
  events: ObservabilityEvent[];
  hasMore: boolean;
  nextCursor: string | null;
}

export const observabilityApi = createApi({
  reducerPath: "observabilityApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Observability"],
  endpoints: (builder) => ({
    getObservabilitySessions: builder.query<
      ObservabilitySession[],
      { projectId: string }
    >({
      query: ({ projectId }) => `projects/${projectId}/observability/sessions`,
      providesTags: ["Observability"],
    }),
    getObservabilityEvents: builder.query<
      ObservabilityResponse,
      { projectId: string; sessionId?: string; cursor?: string }
    >({
      query: ({ projectId, sessionId, cursor }) => {
        const base = sessionId
          ? `projects/${projectId}/observability/sessions/${sessionId}/events`
          : `projects/${projectId}/observability/events`;
        return cursor ? `${base}?cursor=${cursor}` : base;
      },
      providesTags: ["Observability"],
    }),
  }),
});

export const {
  useGetObservabilitySessionsQuery,
  useGetObservabilityEventsQuery,
} = observabilityApi;
