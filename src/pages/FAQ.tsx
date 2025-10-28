import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Home } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does ChessMaster work?',
    answer: 'ChessMaster uses computer vision and machine learning to detect chess moves in real-time from your camera feed. Simply point your camera at your chess board, calibrate the corners, and start playing. The system will automatically detect and record each move.',
  },
  {
    question: 'What equipment do I need?',
    answer: 'You need a device with a camera (smartphone, tablet, or computer with webcam) and a stable internet connection. For best results, ensure good lighting and position the camera to capture the entire chess board clearly.',
  },
  {
    question: 'How accurate is the move detection?',
    answer: 'The accuracy depends on lighting conditions and camera positioning. With proper setup (good lighting, stable camera, clear view of the board), the system achieves over 95% accuracy. You can always review and correct moves after the game.',
  },
  {
    question: 'Can I use any chess board?',
    answer: 'Yes, the system works with most standard chess boards. For optimal performance, use boards with clear contrast between squares and avoid reflective surfaces. The corner calibration helps the system adapt to different board styles.',
  },
  {
    question: 'What analysis features are available?',
    answer: 'After recording a game, you can review it move-by-move with engine analysis powered by Stockfish. The analysis shows the best moves, identifies blunders and mistakes, and provides position evaluations throughout the game.',
  },
  {
    question: 'Can I export my games?',
    answer: 'Yes, you can export your games in standard PGN (Portable Game Notation) format, which is compatible with all major chess platforms and software. Use the "Copy PGN" button to copy the game notation to your clipboard.',
  },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Camera Chess - FAQ</h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex justify-between items-center hover:bg-slate-750 transition"
                >
                  <span className="text-lg font-semibold text-white text-left">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {openIndex === index && (
                  <div className="px-6 py-4 bg-slate-850 border-t border-slate-700">
                    <p className="text-slate-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
