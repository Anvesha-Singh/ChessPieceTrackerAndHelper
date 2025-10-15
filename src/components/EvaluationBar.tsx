interface EvaluationBarProps {
  evaluation: string | null;
}

export default function EvaluationBar({ evaluation }: EvaluationBarProps) {
  if (!evaluation) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-300">Evaluation</span>
          <span className="text-xs text-slate-500">N/A</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-slate-600" />
        </div>
      </div>
    );
  }

  const isMate = evaluation.includes('Mate');
  let percentage = 50;
  let displayValue = '0.00';

  if (isMate) {
    displayValue = evaluation;
    percentage = evaluation.includes('-') ? 0 : 100;
  } else {
    const numValue = parseFloat(evaluation);
    displayValue = evaluation;
    percentage = Math.max(0, Math.min(100, 50 + numValue * 5));
  }

  const barColor = percentage > 50 ? 'bg-green-500' : percentage < 50 ? 'bg-red-500' : 'bg-slate-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-300">Evaluation</span>
        <span className="text-xs font-mono font-bold text-white">{displayValue}</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-slate-400" style={{ marginLeft: '50%' }} />
        </div>
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Black</span>
        <span>White</span>
      </div>
    </div>
  );
}
