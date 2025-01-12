import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { observabilityApi } from "./features/observability/api";
import { projectsApi } from "./features/projects/api";
import projectsReducer from "./features/projects/slice";
import { recordingsApi } from "./features/recordings/api";

export const store = configureStore({
  reducer: {
    [projectsApi.reducerPath]: projectsApi.reducer,
    [recordingsApi.reducerPath]: recordingsApi.reducer,
    [observabilityApi.reducerPath]: observabilityApi.reducer,
    projects: projectsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      projectsApi.middleware,
      recordingsApi.middleware,
      observabilityApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
