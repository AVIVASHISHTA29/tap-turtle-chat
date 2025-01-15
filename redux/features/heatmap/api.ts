import { HeatmapData } from "@/ai/types";
import { createApi } from "@reduxjs/toolkit/query/react";
import { authenticatedBaseQuery } from "../../app/baseQueries";

export const heatmapApi = createApi({
  reducerPath: "heatmapApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Heatmap"],
  endpoints: (builder) => ({
    getHeatmapData: builder.query<HeatmapData[], { projectId: string }>({
      query: ({ projectId }) => `projects/${projectId}/heatmap`,
      providesTags: ["Heatmap"],
    }),
  }),
});

export const { useGetHeatmapDataQuery } = heatmapApi;
