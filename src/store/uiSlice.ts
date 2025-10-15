import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isPlaying: boolean;
  statusMessage: string;
}

const initialState: UIState = {
  isPlaying: false,
  statusMessage: 'Ready to record',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePlaying: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    setStatusMessage: (state, action: PayloadAction<string>) => {
      state.statusMessage = action.payload;
    },
  },
});

export const { togglePlaying, setStatusMessage } = uiSlice.actions;
export default uiSlice.reducer;
