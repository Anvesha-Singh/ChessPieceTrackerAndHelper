import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload as UploadIcon,
} from 'lucide-react';
import ChessBoard from '../components/ChessBoard';
import { Chess, Move } from 'chess.js';
import { fetchCloudEval, formatScore } from '../services/cloudEvalService';

type Classification = 'Best Move' | 'Excellent' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';

interface MoveAnalysis {
  index: number; // 0-based ply index
  moveSAN: string; // SAN of played move
  moveUCI: string; // UCI of played move
  prevFen: string; // FEN before the move
  fen: string; // FEN after the move
  side: 'w' | 'b'; // side to move before the move
  evalPlayedCpSide?: number; // centipawns, perspective of side to move before the move
  evalBestCpSide?: number; // centipawns, perspective of side to move before the move
  evaluationPawns?: number; // evalPlayedCpSide / 100
  bestMoveSAN?: string;
  bestMoveUCI?: string;
  classification?: Classification;
}

export default function Analyze() {
  const navigate = useNavigate();

  const [parsedMoves, setParsedMoves] = useState<MoveAnalysis[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [multiPvForSearch, setMultiPvForSearch] = useState<number>(5);

  const hasGame = parsedMoves.length > 0;
  const isFirstMove = currentMoveIndex === 0;
  const isLastMove = hasGame ? currentMoveIndex === parsedMoves.length - 1 : true;
  const currentAnalysis = hasGame ? parsedMoves[currentMoveIndex] : null;

  // Navigation handlers
  const goToFirst = () => setCurrentMoveIndex(0);
  const goToPrevious = () => setCurrentMoveIndex((i) => Math.max(0, i - 1));
  const goToNext = () => setCurrentMoveIndex((i) => Math.min(parsedMoves.length - 1, i + 1));
  const goToLast = () => setCurrentMoveIndex(parsedMoves.length - 1);

  function getClassificationColor(classification?: string) {
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
  }

  // PGN file reader
  async function onPGNSelected(file: File) {
    setErrorMsg(null);
    setLoadingMsg('Reading PGN...');
    try {
      const text = await file.text();
      const base = new Chess();
      // Load PGN; some typings report void, so rely on history length to verify success
      base.loadPgn(text as any);
      if ((base.history({ verbose: true }) as Move[]).length === 0) {
        throw new Error('Could not parse PGN or it is empty.');
      }

      // Build mainline move list with positions
      const replay = new Chess();
      const history = base.history({ verbose: true }) as Move[];
      const moves: MoveAnalysis[] = [];

      for (let i = 0; i < history.length; i++) {
        const prevFen = replay.fen();
        const side = (prevFen.split(' ')[1] as 'w' | 'b');
        const m = history[i];
        const uci = toUci(m);
        const san = m.san;
        replay.move({ from: m.from, to: m.to, promotion: m.promotion });
        const afterFen = replay.fen();
        moves.push({
          index: i,
          moveSAN: san,
          moveUCI: uci,
          prevFen,
          fen: afterFen,
          side,
        });
      }

      setParsedMoves(moves);
      setCurrentMoveIndex(0);
      setLoadingMsg('Analyzing moves via Cloud Eval...');
      await analyzeMovesInPlace(moves, setLoadingMsg, multiPvForSearch);
      setParsedMoves([...moves]); // trigger re-render with enriched data
      setLoadingMsg(null);
    } catch (e: any) {
      setLoadingMsg(null);
      setErrorMsg(e?.message || 'Failed to load PGN.');
    }
  }

  // Move-by-move analyzer
  async function analyzeMovesInPlace(moves: MoveAnalysis[], setMsg: (s: string) => void, multiPv: number) {
    for (let i = 0; i < moves.length; i++) {
      const item = moves[i];
      setMsg(`Analyzing move ${i + 1}/${moves.length}...`);
      // 1) Evaluate position before move with MultiPV
      const pre = await fetchCloudEval(item.prevFen, multiPv);
      const pvs = pre.pvs || [];
      const top = pvs[0];
      if (top) {
        const scoreTop = formatScore(top);
        if (scoreTop) {
          const cpWhite = scoreTop.value; // white perspective
          const cpSide = item.side === 'w' ? cpWhite : -cpWhite;
          item.evalBestCpSide = cpSide;
          // best move UCI and SAN
          const firstUci = (top.moves || '').split(' ')[0] || '';
          if (firstUci) {
            item.bestMoveUCI = firstUci;
            item.bestMoveSAN = uciToSan(item.prevFen, firstUci) || firstUci;
          }
        }

        // 2) Try to find played move among PVs to get its eval without extra request
        const played = pvs.find((pv) => (pv.moves || '').startsWith(item.moveUCI));
        if (played) {
          const scorePlayed = formatScore(played);
          if (scorePlayed) {
            const cpWhite = scorePlayed.value;
            const cpSide = item.side === 'w' ? cpWhite : -cpWhite;
            item.evalPlayedCpSide = cpSide;
          }
        }
      }

      // 3) If we still don't have played eval, evaluate the position after the move (single PV)
      if (typeof item.evalPlayedCpSide !== 'number') {
        const post = await fetchCloudEval(item.fen, 1);
        const pv0 = (post.pvs || [])[0];
        if (pv0) {
          const scorePlayed = formatScore(pv0);
          if (scorePlayed) {
            // Note: pv0 is from the perspective of side to move in the post position; but
            // we want eval from the perspective of the side who just moved (pre-move side).
            // Stock eval cp is white-centric; mapping to pre-move side remains the same:
            const cpWhite = scorePlayed.value;
            const cpSide = item.side === 'w' ? cpWhite : -cpWhite;
            item.evalPlayedCpSide = cpSide;
          }
        }
      }

      // 4) Derive evaluation in pawns and classification
      if (typeof item.evalPlayedCpSide === 'number') {
        item.evaluationPawns = item.evalPlayedCpSide / 100;
      }
      if (typeof item.evalBestCpSide === 'number' && typeof item.evalPlayedCpSide === 'number') {
        const delta = item.evalBestCpSide - item.evalPlayedCpSide; // positive if worse than best
        item.classification = classifyDelta(delta);
      }
    }
  }

  function classifyDelta(deltaCp: number): Classification {
    const d = Math.abs(deltaCp);
    if (d <= 15) return 'Best Move'; // <= 0.15 pawns
    if (d <= 35) return 'Excellent'; // <= 0.35
    if (d <= 70) return 'Good'; // <= 0.7
    if (d <= 120) return 'Inaccuracy'; // <= 1.2
    if (d <= 250) return 'Mistake'; // <= 2.5
    return 'Blunder';
  }

  function toUci(m: Move): string {
    const promo = m.promotion ? m.promotion : '';
    return `${m.from}${m.to}${promo}`;
  }

  function uciToSan(fen: string, uci: string): string | null {
    try {
      const game = new Chess(fen);
      const moveObj = {
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: (uci.length > 4 ? (uci.slice(4, 5) as any) : undefined),
      };
      const res = game.move(moveObj);
      return res ? res.san : null;
    } catch {
      return null;
    }
  }

  const moveGrid = useMemo(() => {
    return parsedMoves.map((m, index) => ({
      index,
      label: `${Math.floor(index / 2) + 1}. ${m.moveSAN}`,
    }));
  }, [parsedMoves]);

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
        {/* Upload panel */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <UploadIcon className="w-5 h-5" />
              <span>Upload a PGN file to analyze your game</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer">
                <input
                  type="file"
                  accept=".pgn,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPGNSelected(f);
                  }}
                />
                Choose PGN
              </label>
              <div className="text-sm text-slate-400">
                MultiPV:
                <select
                  value={multiPvForSearch}
                  onChange={(e) => setMultiPvForSearch(parseInt(e.target.value, 10))}
                  className="ml-2 bg-slate-700 text-white rounded px-2 py-1"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>
          </div>
          {loadingMsg && (
            <div className="mt-3 text-sm text-slate-300">{loadingMsg}</div>
          )}
          {errorMsg && (
            <div className="mt-3 text-sm text-red-400">{errorMsg}</div>
          )}
        </div>

        {!hasGame ? (
          <div className="max-w-6xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-8 text-slate-300">
            <p className="mb-2">No game loaded yet.</p>
            <p>Use the "Choose PGN" button above to select a PGN file.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Board Position</h2>
                <div className="flex justify-center">
                  <ChessBoard fen={currentAnalysis?.fen || ''} size={400} />
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
                      Move {currentMoveIndex + 1} / {parsedMoves.length}
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
                    {moveGrid.map(({ index, label }) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMoveIndex(index)}
                        className={`px-3 py-2 rounded text-left transition ${
                          index === currentMoveIndex
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Move Analysis</h2>

                {currentAnalysis && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">Move Played</h3>
                      <p className="text-3xl font-bold text-white">{currentAnalysis.moveSAN}</p>
                      <p className="text-xs text-slate-500">UCI: {currentAnalysis.moveUCI}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">Classification</h3>
                      <p className={`text-2xl font-bold ${getClassificationColor(currentAnalysis.classification)}`}>
                        {currentAnalysis.classification || 'Analyzing...'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">Evaluation (side to move)</h3>
                      <p className={`text-xl font-semibold ${
                        (currentAnalysis.evaluationPawns ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {typeof currentAnalysis.evaluationPawns === 'number'
                          ? `${currentAnalysis.evaluationPawns >= 0 ? '+' : ''}${currentAnalysis.evaluationPawns.toFixed(2)}`
                          : '…'}
                      </p>
                      {typeof currentAnalysis.evalBestCpSide === 'number' && typeof currentAnalysis.evalPlayedCpSide === 'number' && (
                        <p className="text-xs text-slate-400 mt-1">
                          Δ vs best: {((currentAnalysis.evalBestCpSide - currentAnalysis.evalPlayedCpSide) / 100).toFixed(2)} pawns
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-400 mb-1">Best Alternative</h3>
                      <p className="text-xl font-semibold text-blue-400">{currentAnalysis.bestMoveSAN || '…'}</p>
                      {currentAnalysis.bestMoveUCI && (
                        <p className="text-xs text-slate-500">UCI: {currentAnalysis.bestMoveUCI}</p>
                      )}
                      {currentAnalysis.bestMoveSAN && currentAnalysis.moveSAN !== currentAnalysis.bestMoveSAN && (
                        <p className="text-sm text-slate-500 mt-2">
                          Suggested by engine as the top continuation.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>
                    Evaluations are fetched from Lichess Cloud Eval for each position. Classifications are based on
                    the difference between the best line and the played move, from the mover's perspective.
                  </p>
                  <p className="pt-2 text-slate-400">
                    Positive values favor the side to move. Δ shows how far the played move is from the best.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
