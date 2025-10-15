import { useEffect, useState } from 'react';
import { stockfishService } from '../services/stockfishService';
import { useAppSelector } from '../store/hooks';

export function MentorPanel() {
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [lastLine, setLastLine] = useState<string>('');
  const currentFen = useAppSelector((state) => state.game.fen);

  useEffect(() => {
    stockfishService.onMessage((message: string) => {
      if (typeof message !== 'string') return;
      setLastLine(message);

      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1];
        setBestMove(move);
      }

      // Robust score parser: info ... score (cp|mate) <value>
      if (message.startsWith('info') && message.includes('score')) {
        const m = message.match(/score\s+(cp|mate)\s+(-?\d+)/);
        if (m) {
          const type = m[1];
          const value = parseInt(m[2], 10);
          if (type === 'mate') {
            setEvaluation(`Mate in ${Math.abs(value)}`);
          } else {
            const raw = value / 100.0;
            const playerTurn = currentFen.split(' ')[1];
            const adjusted = playerTurn === 'w' ? raw : -raw;
            setEvaluation(adjusted.toFixed(2));
          }
        }
      }
    });
  }, [currentFen]);

  useEffect(() => {
    if (currentFen) {
      setBestMove('Thinking...');
      setEvaluation(null);
      stockfishService.analyzePosition(currentFen);
    }
  }, [currentFen]);

  return (
    <div className="p-4 bg-slate-800 rounded-lg mt-4">
      <h3 className="text-lg font-bold text-white mb-2">Mentor Analysis</h3>
      <div className="space-y-1 text-slate-300">
        <p>
          Best Move: <strong className="text-yellow-400">{bestMove || 'N/A'}</strong>
        </p>
        <p>
          Evaluation: <strong className="text-yellow-400">{evaluation || 'N/A'}</strong>
        </p>
        <p className="text-xs text-slate-500 truncate" title={lastLine}>Engine: {lastLine || '...'}</p>
      </div>
    </div>
  );
}
