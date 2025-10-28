import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { AlertCircle, Upload as UploadIcon, FileVideo, Download } from 'lucide-react';
import { inferPGNFromVideo } from '../services/videoInference';
import { useAppDispatch } from '../store/hooks';
import { setGameState } from '../store/gameSlice';

export default function Upload() {
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pgn, setPgn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 768;

      if (isPortrait && isMobile) {
        const warning = document.getElementById('orientation-warning');
        if (warning) warning.classList.remove('hidden');
      } else {
        const warning = document.getElementById('orientation-warning');
        if (warning) warning.classList.add('hidden');
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPgn(null);
    setProgress(0);
    setError(null);
  };

  const onAnalyze = async () => {
    if (!file || isAnalyzing) return;
    setIsAnalyzing(true);
    setProgress(0);
    setPgn(null);
    setError(null);
    try {
      const result = await inferPGNFromVideo(file, { onProgress: setProgress, maxMoves: 12 });
      setPgn(result.pgn);
      dispatch(setGameState({ fen: result.finalFen, pgn: result.pgn }));
    } catch (e) {
      setError('Failed to analyze the video.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onDownloadPGN = () => {
    if (!pgn) return;
    const blob = new Blob([pgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = downloadRef.current;
    if (a) {
      a.href = url;
      a.download = 'analysis.pgn';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div
        id="orientation-warning"
        className="hidden bg-yellow-500 text-slate-900 px-4 py-3 flex items-center gap-2 justify-center"
      >
        <AlertCircle className="w-5 h-5" />
        <span className="font-semibold">Please rotate your device to landscape mode for the best experience</span>
      </div>

      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <UploadIcon className="w-5 h-5 text-green-400" />
          <h1 className="text-xl font-bold text-white">Camera Chess - Upload Video</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileVideo className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Upload a video for analysis</h2>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={onFileChange}
                  className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                />
                {file && (
                  <p className="mt-2 text-xs text-slate-400">Selected: {file.name}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onAnalyze}
                  disabled={!file || isAnalyzing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition"
                >
                  {isAnalyzing ? 'Analyzing…' : 'Analyze Video'}
                </button>
                <a ref={downloadRef} className="hidden" />
                <button
                  onClick={onDownloadPGN}
                  disabled={!pgn}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  Download PGN
                </button>
              </div>

              {isAnalyzing && (
                <div className="mt-2">
                  <div className="h-2 bg-slate-700 rounded">
                    <div
                      className="h-2 bg-blue-500 rounded"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Processing… {progress}%</p>
                </div>
              )}

              {pgn && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Extracted PGN</h3>
                  <pre className="bg-slate-900 border border-slate-700 rounded p-3 text-xs text-white whitespace-pre-wrap break-words">
{pgn}
                  </pre>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
