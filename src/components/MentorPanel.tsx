import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { fetchCloudEval, formatScore, CloudEvalPV } from '../services/cloudEvalService';
import { Chess } from 'chess.js';

export function MentorPanel() {
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [depth, setDepth] = useState<number | null>(null);
  const [knodes, setKnodes] = useState<number | null>(null);
  const [pvs, setPvs] = useState<CloudEvalPV[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [multiPv, setMultiPv] = useState<number>(3);
  const [variationPlies, setVariationPlies] = useState<number>(12); // number of plies to show in PV
  const [perspective, setPerspective] = useState<'white' | 'side'>('white');
  const currentFen = useAppSelector((state) => state.game.fen);
  const evalLabel = perspective === 'white' ? 'Evaluation (white)' : 'Evaluation (side to move)';

  useEffect(() => {
    if (currentFen) {
      let cancelled = false;
      setBestMove('Thinking...');
      setEvaluation(null);
      setDepth(null);
      setKnodes(null);
      setPvs(null);
      setError(null);

      (async () => {
        try {
          const data = await fetchCloudEval(currentFen, multiPv);
          if (cancelled) return;
          const pvList = data.pvs ?? [];
          setDepth(data.depth ?? null);
          setKnodes(data.knodes ?? null);
          setPvs(pvList);

          if (pvList.length > 0) {
            const top = pvList[0];
            const score = formatScore(top);
            if (score) {
              // Show evaluation from selected perspective
              if (score.kind === 'mate') {
                setEvaluation(score.text);
              } else {
                const cp = score.value; // cp from white's perspective
                const side = currentFen.split(' ')[1];
                const adjusted = perspective === 'white' ? cp : (side === 'w' ? cp : -cp);
                setEvaluation((adjusted / 100).toFixed(2));
              }
            }
            const firstMoveUci = (top.moves || '').split(' ')[0] || null;
            if (firstMoveUci) {
              const san = uciToSan(currentFen, firstMoveUci);
              setBestMove(san ? `${san} (${firstMoveUci})` : firstMoveUci);
            } else {
              setBestMove('N/A');
            }
          } else {
            setBestMove('N/A');
            setEvaluation('N/A');
          }
        } catch (e) {
          setError('Failed to fetch analysis from Lichess Cloud Eval');
          setBestMove('N/A');
          setEvaluation('N/A');
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [currentFen, multiPv, perspective]);

  const topLines = useMemo(() => {
    if (!pvs || pvs.length === 0) return [] as string[];
    return pvs.map((pv) => {
      const sanSeq = pvToSan(currentFen, pv.moves || '', variationPlies);
      return sanSeq || pv.moves;
    });
  }, [pvs, currentFen, variationPlies]);

  function uciToSan(fen: string, uci: string): string | null {
    try {
      const game = new Chess(fen);
      const moveObj = {
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? (uci.slice(4, 5) as any) : undefined,
      };
      const result = game.move(moveObj);
      return result ? result.san : null;
    } catch {
      return null;
    }
  }

  function pvToSan(fen: string, pvMoves: string, maxPlies = 20): string | null {
    try {
      const game = new Chess(fen);
      const parts = pvMoves.split(' ').filter(Boolean);
      const sanMoves: string[] = [];
      for (let i = 0; i < parts.length && i < maxPlies; i++) {
        const uci = parts[i];
        const moveObj = {
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.length > 4 ? (uci.slice(4, 5) as any) : undefined,
        };
        const res = game.move(moveObj);
        if (!res) break;
        sanMoves.push(res.san);
      }
      // Build a simple SAN string like: 2... dxe4 N(g1)f3 ...
      // For simplicity, just join SAN with spaces (no move numbers)
      return sanMoves.join(' ');
    } catch {
      return null;
    }
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg mt-4">
      <h3 className="text-lg font-bold text-white mb-2">Mentor Analysis</h3>
      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="flex flex-col sm:flex-col md:flex-row md:items-center gap-1 md:gap-2 min-w-0">
          <label className="text-slate-400 whitespace-nowrap">Perspective</label>
          <select
            className="bg-slate-700 text-white rounded px-2 py-1 w-full md:w-auto"
            value={perspective}
            onChange={(e) => setPerspective(e.target.value as 'white' | 'side')}
            aria-label="Evaluation perspective"
          >
            <option value="white">White</option>
            <option value="side">Side to move</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-col md:flex-row md:items-center gap-1 md:gap-2 min-w-0">
          <label className="text-slate-400 whitespace-nowrap">Lines</label>
          <select
            className="bg-slate-700 text-white rounded px-2 py-1 w-full md:w-auto"
            value={multiPv}
            onChange={(e) => setMultiPv(parseInt(e.target.value, 10))}
            aria-label="Number of lines (MultiPV)"
          >
            <option value={1}>1</option>
            <option value={3}>3</option>
            <option value={5}>5</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-col md:flex-row md:items-center gap-1 md:gap-2 min-w-0">
          <label className="text-slate-400 whitespace-nowrap">Preview length</label>
          <select
            className="bg-slate-700 text-white rounded px-2 py-1 w-full md:w-auto"
            value={variationPlies}
            onChange={(e) => setVariationPlies(parseInt(e.target.value, 10))}
            aria-label="Variation preview length (plies)"
          >
            <option value={6}>3 moves</option>
            <option value={10}>5 moves</option>
            <option value={14}>7 moves</option>
            <option value={20}>10 moves</option>
          </select>
        </div>
      </div>
      <div className="space-y-1 text-slate-300">
        <p>
          Best Move: <strong className="text-yellow-400">{bestMove || 'N/A'}</strong>
        </p>
        <p>
          {evalLabel}: <strong className="text-yellow-400">{evaluation || 'N/A'}</strong>
        </p>
        <p className="text-xs text-slate-500">
          Depth: {depth ?? '…'} • kNodes: {knodes ?? '…'}
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {topLines.length > 0 && (
          <div className="mt-2 text-xs text-slate-400 space-y-1">
            {topLines.map((line, i) => (
              <div key={i}>PV {i + 1}: {line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
