import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './gameSlice';
import cornersReducer from './cornersSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    corners: cornersReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
