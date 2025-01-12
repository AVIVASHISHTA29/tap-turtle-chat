import { createSlice } from "@reduxjs/toolkit";
import { TInitialState } from "./types";

const initialState: TInitialState = {
  selectedProject: null,
  projects: [],
  loading: false,
  groupAnalysis: false,
  selectedRecordings: [],
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
    setGroupAnalysis: (state, action) => {
      state.groupAnalysis = action.payload;
    },
    pushSelectedRecordings: (state, action) => {
      state.selectedRecordings = [...state.selectedRecordings, action.payload];
    },
    removeSelectedRecordings: (state, action) => {
      state.selectedRecordings = state.selectedRecordings.filter(
        (recording) => recording.session_id !== action.payload
      );
    },
    clearSelectedRecordings: (state) => {
      state.selectedRecordings = [];
    },
    setAllSelectedRecordings: (state, action) => {
      state.selectedRecordings = action.payload;
    },
  },
});

export const {
  setSelectedProject,
  setProjects,
  setLoading,
  setGroupAnalysis,
  pushSelectedRecordings,
  removeSelectedRecordings,
  clearSelectedRecordings,
  setAllSelectedRecordings,
} = projectsSlice.actions;

export default projectsSlice.reducer;
