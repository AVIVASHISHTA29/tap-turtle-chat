import { createSlice } from "@reduxjs/toolkit";
import { TInitialState } from "./types";

const initialState: TInitialState = {
  selectedProject: null,
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setSelectedProject: (state, action) => {
      state.selectedProject = action.payload;
    },
  },
});

export const { setSelectedProject } = projectsSlice.actions;

export default projectsSlice.reducer;
