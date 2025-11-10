import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CornersPayload } from '../types/index';

interface Position {
  x: number;
  y: number;
}

interface CornersState {
  positions: {
    a1: Position;
    h1: Position;
    a8: Position;
    h8: Position;
  };
}

const initialState: CornersState = {
  positions: {
    a1: { x: 50, y: 400 },
    h1: { x: 600, y: 400 },
    a8: { x: 50, y: 50 },
    h8: { x: 600, y: 50 },
  },
};

const cornersSlice = createSlice({
  name: 'corners',
  initialState,
  reducers: {
    updateCornerPosition: (
      state,
      action: PayloadAction<{ corner: 'a1' | 'h1' | 'a8' | 'h8'; position: Position }>
    ) => {
      state.positions[action.payload.corner] = action.payload.position;
    },
    // Bulk/set from detection pipeline
    cornersSet: (state, action: PayloadAction<CornersPayload>) => {
      const { key, xy } = action.payload;
      state.positions[key] = xy;
    },
    resetCorners: (state) => {
      state.positions = initialState.positions;
    },
  },
});

export const { updateCornerPosition, cornersSet, resetCorners } = cornersSlice.actions;
export default cornersSlice.reducer;
