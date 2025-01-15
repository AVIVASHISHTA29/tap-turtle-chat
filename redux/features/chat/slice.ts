import { createSlice } from "@reduxjs/toolkit";
import { TInitialState } from "./type";

const initialState: TInitialState = {
  loading: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setLoading } = chatSlice.actions;

export default chatSlice.reducer;
