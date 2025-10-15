import { useNavigate } from 'react-router-dom';
import { Video, Upload, LineChart, HelpCircle } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Camera Chess</h1>
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
            Login with Lichess
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-4">
            Real-time Camera Chess
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Record and analyze your over-the-board chess games with AI-powered move detection
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/record')}
            className="group p-8 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-blue-500 rounded-xl transition transform hover:scale-105"
          >
            <Video className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Record Game</h3>
            <p className="text-slate-400">
              Start recording your chess game in real-time using your camera
            </p>
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="group p-8 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-green-500 rounded-xl transition transform hover:scale-105"
          >
            <Upload className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Upload Video</h3>
            <p className="text-slate-400">
              Upload a recorded video of your chess game for analysis
            </p>
          </button>

          <button
            onClick={() => navigate('/analyze')}
            className="group p-8 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-purple-500 rounded-xl transition transform hover:scale-105"
          >
            <LineChart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Analyze Game</h3>
            <p className="text-slate-400">
              Review completed games with detailed move-by-move analysis
            </p>
          </button>

          <button
            onClick={() => navigate('/faq')}
            className="group p-8 bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 hover:border-yellow-500 rounded-xl transition transform hover:scale-105"
          >
            <HelpCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">FAQ</h3>
            <p className="text-slate-400">
              Frequently asked questions about using Camera Chess
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
