import { useEffect, useRef, useState } from 'react';
import { GraphModel } from '@tensorflow/tfjs-converter';
import Sidebar from '../components/Sidebar';
import { AlertCircle, Upload as UploadIcon, FileVideo, Download, Loader } from 'lucide-react';
import { runVideoInferenceStreaming } from '../services/videoInferenceStreaming';
import { useAppDispatch } from '../store/hooks';
import { setGameState } from '../store/gameSlice';
import { setStatusMessage } from '../store/uiSlice';

interface UploadProps {
  piecesModelRef?: React.RefObject<GraphModel | null>;
}

export default function Upload({ piecesModelRef }: UploadProps) {
  const dispatch = useAppDispatch();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pgn, setPgn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>('Ready to upload video');
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

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
    setStatusText(f ? `Selected: ${f.name}` : 'Ready to upload video');
    setPlaying(false);

    // Create preview for the selected video
    if (f && videoRef.current) {
      const objectUrl = URL.createObjectURL(f);
      videoRef.current.src = objectUrl;
    }
  };

  const onAnalyze = async () => {
    if (!file || isAnalyzing) return;

    if (!piecesModelRef?.current) {
      setError('Pieces model not loaded. Please go to Record page first to load models.');
      dispatch(setStatusMessage('Models not loaded'));
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setPgn(null);
    setError(null);
    setStatusText('Starting video analysis...');
    setPlaying(false);

    try {
      const result = await runVideoInferenceStreaming(piecesModelRef, file, {
        onProgress: (prog: number) => {
          setProgress(prog);
          setStatusText(`Processing video... ${Math.round(prog)}%`);
        },
        maxMoves: 20,
      });

      setPgn(result.pgn);
      dispatch(setGameState({ fen: result.fen, pgn: result.pgn }));
      dispatch(setStatusMessage('Video analysis complete'));
      setStatusText('✓ Analysis complete! Download your PGN below.');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to analyze the video.';
      setError(errorMsg);
      setStatusText('Error during analysis');
      console.error('Inference error:', e);
      dispatch(setStatusMessage(`Error: ${errorMsg}`));
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
      a.download = `chess-analysis-${Date.now()}.pgn`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const hasModels = !!piecesModelRef?.current;

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <div
        id="orientation-warning"
        className="hidden bg-yellow-500 text-slate-900 px-4 py-3 flex items-center gap-2 justify-center"
      >
        <AlertCircle className="w-5 h-5" />
        <span className="font-semibold">
          Please rotate your device to landscape mode for the best experience
        </span>
      </div>

      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <UploadIcon className="w-5 h-5 text-green-400" />
          <h1 className="text-xl font-bold text-white">Camera Chess - Upload & Analyze</h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Models Status */}
            <div
              className={`border rounded-xl p-4 ${
                hasModels ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'
              }`}
            >
              <p className={`text-sm ${hasModels ? 'text-green-300' : 'text-yellow-300'}`}>
                {hasModels ? '✓ Models loaded and ready' : '⚠ Models not loaded'}
              </p>
            </div>

            {/* Main Upload Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileVideo className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Upload video for analysis</h2>
              </div>

              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={onFileChange}
                    disabled={isAnalyzing}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 disabled:opacity-50"
                  />
                  {file && (
                    <p className="mt-2 text-xs text-slate-400">
                      Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {/* Video Preview */}
                {file && (
                  <div className="bg-slate-900 rounded border border-slate-700 p-3">
                    <video
                      ref={videoRef}
                      className="w-full rounded max-h-[300px] object-contain"
                      controls
                    />
                  </div>
                )}

                {/* Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={onAnalyze}
                    disabled={!file || isAnalyzing || !hasModels}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      'Analyze Video'
                    )}
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

                {/* Progress Bar */}
                {isAnalyzing && (
                  <div className="mt-4 space-y-2">
                    <div className="h-2 bg-slate-700 rounded overflow-hidden">
                      <div
                        className="h-2 bg-blue-500 rounded transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">{statusText}</p>
                  </div>
                )}

                {/* PGN Output */}
                {pgn && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-slate-300">Extracted PGN</h3>
                    <div className="bg-slate-900 border border-slate-700 rounded p-3 max-h-[300px] overflow-y-auto">
                      <pre className="text-xs text-white whitespace-pre-wrap break-words font-mono">
                        {pgn}
                      </pre>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pgn);
                        dispatch(setStatusMessage('PGN copied to clipboard'));
                      }}
                      className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                    >
                      Copy PGN
                    </button>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Status Box */}
                {!isAnalyzing && !pgn && (
                  <div className="mt-4 p-3 bg-slate-700/50 rounded text-xs text-slate-300">
                    <p className="font-semibold mb-1">Status:</p>
                    <p>{statusText}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">How It Works</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Upload a chess video (MP4, WebM, etc.)</li>
                <li>• System streams frames at 10 FPS</li>
                <li>• Runs piece detection on each frame</li>
                <li>• No frame storage - efficient memory usage</li>
                <li>• Detects moves and generates PGN</li>
                <li>• Download when complete</li>
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Tips for Best Results</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>✓ Good lighting - avoid shadows on the board</li>
                <li>✓ Clear camera angle - board must be fully visible</li>
                <li>✓ Steady camera - use tripod if possible</li>
                <li>✓ Clear pieces - pieces must be distinguishable</li>
                <li>✓ Shorter videos - faster analysis with fewer frames</li>
              </ul>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}