import { Lightbulb } from 'lucide-react';

interface MentorSuggestionProps {
  bestMove: string | null;
  isAnalyzing: boolean;
}

function formatMove(move: string): string {
  if (!move || move.length < 4) return move;

  const from = move.substring(0, 2);
  const to = move.substring(2, 4);
  const promotion = move.length > 4 ? move.substring(4) : '';

  return `${from.toUpperCase()} → ${to.toUpperCase()}${promotion ? ` (${promotion.toUpperCase()})` : ''}`;
}

export default function MentorSuggestion({ bestMove, isAnalyzing }: MentorSuggestionProps) {
  return (
    <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <h4 className="text-sm font-semibold text-white">Mentor Suggests</h4>
      </div>
      <div className="text-center py-2">
        {isAnalyzing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Thinking...</span>
          </div>
        ) : bestMove ? (
          <span className="text-lg font-mono font-bold text-green-400">{formatMove(bestMove)}</span>
        ) : (
          <span className="text-sm text-slate-500 italic">No suggestion yet</span>
        )}
      </div>
    </div>
  );
}
