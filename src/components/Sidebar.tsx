import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import {
  Play,
  Pause,
  Square,
  Home,
  Copy,
  Camera,
  Crosshair,
  Wand2,
  Send,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { togglePlaying, setStatusMessage } from '../store/uiSlice';
import { resetGame, setGameState } from '../store/gameSlice';
import { resetCorners } from '../store/cornersSlice';
import ChessBoard from './ChessBoard';
import { MentorPanel } from './MentorPanel';

const mockMoves = [
  'e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd3', 'Nf6', 'Nc3', 'd6'
];

export default function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isPlaying, statusMessage } = useAppSelector((state) => state.ui);
  const { fen, pgn } = useAppSelector((state) => state.game);
  // Mentor analysis handled by MentorPanel; no state needed here

  const [manualMove, setManualMove] = useState('');

  const handlePlayPause = () => {
    dispatch(togglePlaying());
    dispatch(setStatusMessage(isPlaying ? 'Paused' : 'Recording...'));
  };

  const handleStop = () => {
    dispatch(resetGame());
    dispatch(setStatusMessage('Ready to record'));
  };

  const handleFindCorners = () => {
    dispatch(resetCorners());
    dispatch(setStatusMessage('Corners reset to default positions'));
  };

  const handleSimulateMove = () => {
    const chess = new Chess(fen);
    const moves = chess.moves();

    if (moves.length === 0) {
      dispatch(setStatusMessage('Game over - no more moves available'));
      return;
    }

    const randomMove = mockMoves[Math.floor(Math.random() * mockMoves.length)];
    const validMoves = chess.moves();
    const moveToMake = validMoves.find(m => m.startsWith(randomMove)) || validMoves[0];

    chess.move(moveToMake);
    const newFen = chess.fen();
    const newPgn = pgn ? `${pgn} ${moveToMake}` : moveToMake;

    dispatch(setGameState({ fen: newFen, pgn: newPgn }));
    dispatch(setStatusMessage(`Move detected: ${moveToMake}`));
  };

  const handleCopyPGN = () => {
    if (pgn) {
      navigator.clipboard.writeText(pgn);
      dispatch(setStatusMessage('PGN copied to clipboard'));
    }
  };

  const handleManualMove = () => {
    if (!manualMove.trim()) return;

    const chess = new Chess(fen);

    try {
      const result = chess.move(manualMove.trim());

      if (result) {
        const newFen = chess.fen();
        // Build PGN text ourselves to avoid headers/FEN blocks
        const san = result.san; // e.g. e4, Nf3, ...
        let newPgn = pgn || '';
        // Determine if we need to prepend move number (when it's White's move that just played)
        const moveNumber = chess.history().length % 2 === 1 ? Math.ceil(chess.history().length / 2) : Math.ceil(chess.history().length / 2);
        const isWhiteMove = result.color === 'w';
        if (!newPgn) {
          newPgn = isWhiteMove ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
        } else {
          // add space and appropriate move number if black starts a new pair
          const needsNumber = !isWhiteMove;
          newPgn = `${newPgn} ${needsNumber ? `${moveNumber}... ` : ''}${san}`.trim();
        }

        dispatch(setGameState({ fen: newFen, pgn: newPgn }));
        dispatch(setStatusMessage(`Manual move: ${result.san}`));
        setManualMove('');
      } else {
        dispatch(setStatusMessage('Invalid move - please try again'));
        setTimeout(() => {
          dispatch(setStatusMessage('Ready to record'));
        }, 2000);
      }
    } catch (error) {
      dispatch(setStatusMessage('Invalid move - please try again'));
      setTimeout(() => {
        dispatch(setStatusMessage('Ready to record'));
      }, 2000);
    }
  };

  // Mentor toggle removed in new approach

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Controls</h2>

        <div className="space-y-3">
          <button className="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
            <Camera className="w-4 h-4" />
            Select Device
          </button>

          <button
            onClick={handleFindCorners}
            className="w-full flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <Crosshair className="w-4 h-4" />
            Find Corners
          </button>

          <div className="flex gap-2">
            <button
              onClick={handlePlayPause}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                isPlaying
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </button>

            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSimulateMove}
            className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Wand2 className="w-4 h-4" />
            Simulate Next Move
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Current Position</h3>
        <div className="flex justify-center">
          <ChessBoard fen={fen} size={240} />
        </div>
      </div>

      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Chess Mentor</h3>
        <MentorPanel />
      </div>

      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Manual Move</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualMove}
            onChange={(e) => setManualMove(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualMove()}
            placeholder="e.g., e4, Nf3"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleManualMove}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Status</h3>
        <p className="text-sm text-slate-400 mb-3">{statusMessage}</p>

        <h3 className="text-sm font-semibold text-slate-300 mb-2">Moves</h3>
        <div className="bg-slate-900 rounded p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
          {pgn ? (
            <p className="text-sm text-white font-mono break-words">{pgn}</p>
          ) : (
            <p className="text-sm text-slate-500 italic">No moves yet</p>
          )}
        </div>
      </div>

      <div className="p-4 mt-auto space-y-2">
        <button
          onClick={handleCopyPGN}
          disabled={!pgn}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
        >
          <Copy className="w-4 h-4" />
          Copy PGN
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
        >
          <Home className="w-4 h-4" />
          Home
        </button>
      </div>
    </div>
  );
}
