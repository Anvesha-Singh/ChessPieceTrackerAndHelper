import { AlertTriangle, TrendingDown, Minus, ThumbsUp, Star, Award } from 'lucide-react';
import type { MoveQuality } from '../store/analysisSlice';

interface MoveFeedbackProps {
  moveQuality: MoveQuality;
}

export default function MoveFeedback({ moveQuality }: MoveFeedbackProps) {
  if (!moveQuality) {
    return null;
  }

  const feedbackConfig = {
    blunder: {
      icon: AlertTriangle,
      text: 'Blunder',
      description: 'This move significantly worsens your position',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    mistake: {
      icon: TrendingDown,
      text: 'Mistake',
      description: 'Not the best choice, but recoverable',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
    inaccuracy: {
      icon: Minus,
      text: 'Inaccuracy',
      description: 'A minor imprecision',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    good: {
      icon: ThumbsUp,
      text: 'Good Move',
      description: 'A solid choice',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    excellent: {
      icon: Star,
      text: 'Excellent',
      description: 'Very strong move!',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    best: {
      icon: Award,
      text: 'Best Move',
      description: 'Perfect! The engine agrees',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
    },
  };

  const config = feedbackConfig[moveQuality];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-3`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`text-sm font-bold ${config.color}`}>{config.text}</h4>
          <p className="text-xs text-slate-400 mt-1">{config.description}</p>
        </div>
      </div>
    </div>
  );
}
