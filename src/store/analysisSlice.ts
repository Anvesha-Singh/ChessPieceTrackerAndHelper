import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MoveQuality = 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'excellent' | 'best' | null;

interface AnalysisState {
  evaluation: string | null;
  bestMove: string | null;
  lastMoveAnalysis: MoveQuality;
  status: 'idle' | 'loading' | 'analyzing';
  mentorEnabled: boolean;
  previousEval: number | null;
}

const initialState: AnalysisState = {
  evaluation: null,
  bestMove: null,
  lastMoveAnalysis: null,
  status: 'idle',
  mentorEnabled: true,
  previousEval: null,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<AnalysisState['status']>) => {
      state.status = action.payload;
    },
    setEvaluation: (state, action: PayloadAction<string>) => {
      state.evaluation = action.payload;
    },
    setBestMove: (state, action: PayloadAction<string>) => {
      state.bestMove = action.payload;
    },
    setLastMoveAnalysis: (state, action: PayloadAction<MoveQuality>) => {
      state.lastMoveAnalysis = action.payload;
    },
    setPreviousEval: (state, action: PayloadAction<number | null>) => {
      state.previousEval = action.payload;
    },
    toggleMentor: (state) => {
      state.mentorEnabled = !state.mentorEnabled;
    },
    resetAnalysis: (state) => {
      state.evaluation = null;
      state.bestMove = null;
      state.lastMoveAnalysis = null;
      state.status = 'idle';
      state.previousEval = null;
    },
  },
});

export const {
  setStatus,
  setEvaluation,
  setBestMove,
  setLastMoveAnalysis,
  setPreviousEval,
  toggleMentor,
  resetAnalysis,
} = analysisSlice.actions;

export default analysisSlice.reducer;
