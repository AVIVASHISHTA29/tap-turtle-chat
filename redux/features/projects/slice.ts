import { createSlice } from "@reduxjs/toolkit";
import { TInitialState } from "./types";

const initialState: TInitialState = {
  selectedProject: null,
  projects: [],
  loading: false,
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setSelectedProject: (state, action) => {
      state.selectedProject = action.payload;
    },
    setProjects: (state, action) => {
      state.projects = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setSelectedProject, setProjects, setLoading } =
  projectsSlice.actions;

export default projectsSlice.reducer;
