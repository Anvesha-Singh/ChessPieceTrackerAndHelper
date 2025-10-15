import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import gameReducer, { setGameState } from './gameSlice';
import cornersReducer from './cornersSlice';
import uiReducer from './uiSlice';
import analysisReducer, {
  setStatus,
  setEvaluation,
  setBestMove,
  setLastMoveAnalysis,
  setPreviousEval,
} from './analysisSlice';
import { stockfishService } from '../services/stockfishService';
import type { MoveQuality } from './analysisSlice';

const listenerMiddleware = createListenerMiddleware();

let isInitialized = false;

listenerMiddleware.startListening({
  matcher: isAnyOf(setGameState),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const { mentorEnabled, previousEval } = state.analysis;

    if (!mentorEnabled) return;

    if (!isInitialized) {
      await stockfishService.initialize();
      isInitialized = true;
    }

    const currentFen = action.payload.fen;

    if (currentFen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
      listenerApi.dispatch(setPreviousEval(null));
      return;
    }

    listenerApi.dispatch(setStatus('analyzing'));

    try {
      const currentEval = await stockfishService.getEvaluation(currentFen, 12);

      if (previousEval !== null) {
        const evalDiff = Math.abs(currentEval - previousEval);
        let moveQuality: MoveQuality = 'good';

        if (evalDiff >= 300) {
          moveQuality = 'blunder';
        } else if (evalDiff >= 150) {
          moveQuality = 'mistake';
        } else if (evalDiff >= 50) {
          moveQuality = 'inaccuracy';
        } else if (evalDiff <= 10) {
          moveQuality = 'excellent';
        }

        listenerApi.dispatch(setLastMoveAnalysis(moveQuality));
      }

      const { evaluation, bestMove } = await stockfishService.analyzePosition(currentFen, 15);

      listenerApi.dispatch(setEvaluation(evaluation));
      listenerApi.dispatch(setBestMove(bestMove));
      listenerApi.dispatch(setPreviousEval(currentEval));
      listenerApi.dispatch(setStatus('idle'));
    } catch (error) {
      console.error('Analysis error:', error);
      listenerApi.dispatch(setStatus('idle'));
    }
  },
});

export const store = configureStore({
  reducer: {
    game: gameReducer,
    corners: cornersReducer,
    ui: uiReducer,
    analysis: analysisReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
