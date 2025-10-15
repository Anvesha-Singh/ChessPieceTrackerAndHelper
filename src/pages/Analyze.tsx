import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import ChessBoard from '../components/ChessBoard';

interface MoveAnalysis {
  move: string;
  fen: string;
  evaluation: number;
  classification: 'Best Move' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';
  bestMove: string;
}

const mockGame: MoveAnalysis[] = [
  {
    move: 'e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    evaluation: 0.3,
    classification: 'Best Move',
    bestMove: 'e4',
  },
  {
    move: 'e5',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    evaluation: 0.2,
    classification: 'Best Move',
    bestMove: 'e5',
  },
  {
    move: 'Nf3',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2',
    evaluation: 0.3,
    classification: 'Best Move',
    bestMove: 'Nf3',
  },
  {
    move: 'Nc6',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    evaluation: 0.2,
    classification: 'Best Move',
    bestMove: 'Nc6',
  },
  {
    move: 'Bc4',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    evaluation: 0.4,
    classification: 'Good',
    bestMove: 'd4',
  },
  {
    move: 'd6',
    fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    evaluation: -0.8,
    classification: 'Mistake',
    bestMove: 'Bc5',
  },
  {
    move: 'd4',
    fen: 'r1bqkbnr/ppp2ppp/2np4/4p3/2BPP3/5N2/PPP2PPP/RNBQK2R b KQkq d3 0 4',
    evaluation: 1.2,
    classification: 'Excellent',
    bestMove: 'd4',
  },
  {
    move: 'Bg4',
    fen: 'r2qkbnr/ppp2ppp/2np4/4p3/2BPP1b1/5N2/PPP2PPP/RNBQK2R w KQkq - 1 5',
    evaluation: -2.4,
    classification: 'Blunder',
    bestMove: 'exd4',
  },
];

export default function Analyze() {
  const navigate = useNavigate();
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);

  const currentAnalysis = mockGame[currentMoveIndex];
  const isFirstMove = currentMoveIndex === 0;
  const isLastMove = currentMoveIndex === mockGame.length - 1;

  const goToFirst = () => setCurrentMoveIndex(0);
  const goToPrevious = () => setCurrentMoveIndex(Math.max(0, currentMoveIndex - 1));
  const goToNext = () => setCurrentMoveIndex(Math.min(mockGame.length - 1, currentMoveIndex + 1));
  const goToLast = () => setCurrentMoveIndex(mockGame.length - 1);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Best Move':
        return 'text-green-400';
      case 'Excellent':
        return 'text-blue-400';
      case 'Good':
        return 'text-cyan-400';
      case 'Inaccuracy':
        return 'text-yellow-400';
      case 'Mistake':
        return 'text-orange-400';
      case 'Blunder':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Game Analysis</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Board Position</h2>
              <div className="flex justify-center">
                <ChessBoard fen={currentAnalysis.fen} size={400} />
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={goToFirst}
                  disabled={isFirstMove}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToPrevious}
                  disabled={isFirstMove}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="px-6 py-2 bg-slate-900 rounded-lg">
                  <span className="text-white font-semibold">
                    Move {currentMoveIndex + 1} / {mockGame.length}
                  </span>
                </div>

                <button
                  onClick={goToNext}
                  disabled={isLastMove}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={goToLast}
                  disabled={isLastMove}
                  className="p-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Move History</h3>
              <div className="bg-slate-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {mockGame.map((analysis, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMoveIndex(index)}
                      className={`px-3 py-2 rounded text-left transition ${
                        index === currentMoveIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {Math.floor(index / 2) + 1}. {analysis.move}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Move Analysis</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">Move Played</h3>
                  <p className="text-3xl font-bold text-white">{currentAnalysis.move}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">Classification</h3>
                  <p className={`text-2xl font-bold ${getClassificationColor(currentAnalysis.classification)}`}>
                    {currentAnalysis.classification}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">Evaluation</h3>
                  <p className={`text-xl font-semibold ${
                    currentAnalysis.evaluation > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentAnalysis.evaluation > 0 ? '+' : ''}{currentAnalysis.evaluation.toFixed(1)}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">Best Alternative</h3>
                  <p className="text-xl font-semibold text-blue-400">{currentAnalysis.bestMove}</p>
                  {currentAnalysis.move !== currentAnalysis.bestMove && (
                    <p className="text-sm text-slate-500 mt-2">
                      This move was suggested by the engine as the best continuation
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Analysis Summary</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  This is a sample game with mocked analysis data. In a production environment,
                  this panel would display real-time engine evaluations from Stockfish.
                </p>
                <p className="pt-2 text-slate-400">
                  The evaluation shows the position advantage in pawns. Positive values favor White,
                  negative values favor Black.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
