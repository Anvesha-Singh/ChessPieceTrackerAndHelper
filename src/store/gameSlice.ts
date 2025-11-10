import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GameUpdatePayload } from '../types/index';
import { START_FEN } from '../utils/constants';

interface GameState {
  fen: string;
  pgn: string;
  greedy?: boolean;
}

const initialState: GameState = {
  fen: START_FEN,
  pgn: '',
  greedy: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Generic update from detectors or UI
    setGameState: (state, action: PayloadAction<GameUpdatePayload>) => {
      state.fen = action.payload.fen;
      state.pgn = action.payload.pgn;
      state.greedy = action.payload.greedy ?? false;
    },
    // Alias to support existing callers (e.g., findPieces.tsx)
    gameUpdate: (state, action: PayloadAction<GameUpdatePayload>) => {
      state.fen = action.payload.fen;
      state.pgn = action.payload.pgn;
      state.greedy = action.payload.greedy ?? false;
    },
    resetGame: (state) => {
      state.fen = initialState.fen;
      state.pgn = initialState.pgn;
      state.greedy = initialState.greedy;
    },
  },
});

export const { setGameState, gameUpdate, resetGame } = gameSlice.actions;
export default gameSlice.reducer;