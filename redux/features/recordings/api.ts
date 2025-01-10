import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface RecordingSession {
  session_id: string;
  project_id: string;
  start_timestamp: string;
  end_timestamp: string | null;
  page_url: string;
  viewport_width: number;
  viewport_height: number;
  user_agent: string | null;
  referrer: string | null;
}

export interface RecordingEvent {
  rrweb_data: string;
  timestamp: string;
  event_type: number;
}

export interface SessionSummaryData {
  session: {
    session_id: string;
    project_id: string;
    start_timestamp: string;
    end_timestamp: string | null;
    page_url: string;
    viewport_width: number;
    viewport_height: number;
    user_agent: string | null;
    referrer: string | null;
    device: {
      client: {
        type: string;
        name: string;
        version: string;
      };
      os: {
        name: string;
        version: string;
      };
      device: {
        type: string;
        brand: string;
        model: string;
      };
    } | null;
  };
  events: {
    total_clicks: number;
    total_scrolls: number;
    total_mousemoves: number;
    total_page_loads: number;
    first_event_time: string;
    last_event_time: string;
    total_events: number;
    unique_elements_interacted: string[];
    unique_selectors_interacted: string[];
  };
  pageNavigation: Array<{
    timestamp: string;
    metadata: string;
  }>;
}

export const recordingsApi = createApi({
  reducerPath: "recordingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "",
  }),
  endpoints: (builder) => ({
    getRecordingSessions: builder.query<RecordingSession[], string>({
      query: (projectId: string) => ({
        url: `/api/projects/${projectId}/recordings`,
      }),
    }),
    getRecordingEvents: builder.query<
      RecordingEvent[],
      { projectId: string; sessionId: string }
    >({
      query: ({ projectId, sessionId }) => ({
        url: `/api/projects/${projectId}/recordings/${sessionId}/events`,
      }),
    }),
    getSessionSummary: builder.query<
      SessionSummaryData,
      { projectId: string; sessionId: string }
    >({
      query: ({ projectId, sessionId }) => ({
        url: `/api/projects/${projectId}/recordings/${sessionId}/summary`,
      }),
    }),
    getRecordingAnalysis: builder.mutation<
      { analysis: string },
      { projectId: string; sessionId: string }
    >({
      query: ({ projectId, sessionId }) => ({
        url: `/api/projects/${projectId}/recordings/${sessionId}/analysis`,
      }),
    }),
  }),
});

export const {
  useGetRecordingSessionsQuery,
  useGetRecordingEventsQuery,
  useGetSessionSummaryQuery,
  useGetRecordingAnalysisMutation,
} = recordingsApi;
