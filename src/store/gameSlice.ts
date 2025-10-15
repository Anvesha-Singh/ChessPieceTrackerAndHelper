import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GameState {
  fen: string;
  pgn: string;
}

const initialState: GameState = {
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn: '',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameState: (state, action: PayloadAction<{ fen: string; pgn: string }>) => {
      state.fen = action.payload.fen;
      state.pgn = action.payload.pgn;
    },
    resetGame: (state) => {
      state.fen = initialState.fen;
      state.pgn = initialState.pgn;
    },
  },
});

export const { setGameState, resetGame } = gameSlice.actions;
export default gameSlice.reducer;
