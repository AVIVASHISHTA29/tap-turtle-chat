import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { chatApi } from "./features/chat/api";
import chatReducer from "./features/chat/slice";
import { heatmapApi } from "./features/heatmap/api";
import { observabilityApi } from "./features/observability/api";
import { projectsApi } from "./features/projects/api";
import projectsReducer from "./features/projects/slice";
import { recordingsApi } from "./features/recordings/api";
export const store = configureStore({
  reducer: {
    [projectsApi.reducerPath]: projectsApi.reducer,
    [recordingsApi.reducerPath]: recordingsApi.reducer,
    [observabilityApi.reducerPath]: observabilityApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [heatmapApi.reducerPath]: heatmapApi.reducer,
    projects: projectsReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      projectsApi.middleware,
      recordingsApi.middleware,
      observabilityApi.middleware,
      chatApi.middleware,
      heatmapApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
