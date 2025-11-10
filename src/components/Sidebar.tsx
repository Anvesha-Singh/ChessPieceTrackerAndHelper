import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { GraphModel } from '@tensorflow/tfjs-converter';
import {
  Play,
  Pause,
  Square,
  Home,
  Copy,
  Crosshair,
  Wand2,
  Send,
  Loader,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { togglePlaying, setStatusMessage } from '../store/uiSlice';
import { resetGame, setGameState } from '../store/gameSlice';
import ChessBoard from './ChessBoard';
import { MentorPanel } from './MentorPanel';
import { findCorners } from '../utils/findCorners';

interface SidebarProps {
  piecesModelRef?: React.RefObject<GraphModel | null>;
  xcornersModelRef?: React.RefObject<GraphModel | null>;
  videoRef?: React.RefObject<HTMLVideoElement>;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const mockMoves = [
  'e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd3', 'Nf6', 'Nc3', 'd6'
];

export default function Sidebar({
  piecesModelRef,
  xcornersModelRef,
  videoRef,
  canvasRef,
}: SidebarProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isPlaying, statusMessage } = useAppSelector((state) => state.ui);
  const { fen, pgn } = useAppSelector((state) => state.game);

  const [manualMove, setManualMove] = useState('');
  const [isFindingCorners, setIsFindingCorners] = useState(false);

  const handlePlayPause = () => {
    if (!isPlaying) {
      dispatch(setStatusMessage('Recording...'));
    } else {
      dispatch(setStatusMessage('Paused'));
    }
    dispatch(togglePlaying());
  };

  const handleStop = () => {
    dispatch(resetGame());
    dispatch(setStatusMessage('Ready to record'));
  };

  const handleFindCorners = async () => {
    if (isFindingCorners || !piecesModelRef?.current || !xcornersModelRef?.current) {
      dispatch(setStatusMessage('Models not ready or already detecting corners'));
      return;
    }

    setIsFindingCorners(true);
    dispatch(setStatusMessage('Finding board corners...'));

    try {
      await findCorners(
        piecesModelRef,
        xcornersModelRef,
        videoRef,
        canvasRef,
        dispatch,
        (message: string) => {
          dispatch(setStatusMessage(message));
        }
      );
      dispatch(setStatusMessage('Corners found successfully'));
    } catch (error) {
      console.error('Error finding corners:', error);
      dispatch(setStatusMessage('Error finding corners - please try again'));
    } finally {
      setIsFindingCorners(false);
    }
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
    const moveToMake = validMoves.find((m) => m.startsWith(randomMove)) || validMoves[0];

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
        const san = result.san;
        const moveNumber = Math.ceil(chess.history().length / 2);
        const isWhiteMove = result.color === 'w';

        let newPgn = pgn || '';
        if (!newPgn) {
          newPgn = isWhiteMove ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
        } else {
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

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Controls</h2>

        <div className="space-y-3">
          <button
            onClick={handleFindCorners}
            disabled={isFindingCorners || !xcornersModelRef?.current}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition"
          >
            {isFindingCorners ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4" />
                Find Corners
              </>
            )}
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