import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { GraphModel } from '@tensorflow/tfjs-converter';
import { loadModels, areModelsReady } from './utils/loadModels';
import Home from './pages/Home';
import Record from './pages/Record';
import Upload from './pages/Upload';
import Analyze from './pages/Analyze';
import FAQ from './pages/FAQ';

// Loading screen component
const LoadingScreen = ({ progress }: { progress: string }) => (
  <div className="flex items-center justify-center h-screen bg-slate-900">
    <div className="text-center">
      <div className="mb-6">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-blue-500"></div>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Camera Chess</h1>
      <p className="text-slate-400 mb-4">{progress}</p>
      <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 animate-pulse" style={{ width: '66%' }}></div>
      </div>
    </div>
  </div>
);

function App() {
  // Refs to hold the loaded models globally
  const piecesModelRef = useRef<GraphModel | null>(null);
  const xcornersModelRef = useRef<GraphModel | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Load models once when app starts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingMessage('Loading detection models...');
        
        // Load models (should take 2-5 seconds with quantization)
        await loadModels(piecesModelRef, xcornersModelRef);
        
        // Check if models loaded successfully
        if (areModelsReady(piecesModelRef, xcornersModelRef)) {
          setLoadingMessage('Models ready!');
          
          // Give user a brief moment to see success message
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setModelsLoaded(true);
          console.log('✅ App initialization complete');
        } else {
          throw new Error('Models failed to load properly');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to initialize app:', error);
        setLoadingError(errorMessage);
        setLoadingMessage('Failed to load models');
      }
    };

    initializeApp();
  }, []);

  // Show error screen if models fail to load
  if (loadingError) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center p-6 bg-red-900/20 border border-red-700 rounded-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-300 mb-4">Loading Failed</h1>
          <p className="text-red-200 mb-4">{loadingError}</p>
          <p className="text-sm text-red-300 mb-4">
            Ensure the model files exist under the public folder and are served at:
            <br />
            <code>/pieces_model/model.json</code> and <code>/xcorners_model/model.json</code>, then refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading screen until models are ready
  if (!modelsLoaded) {
    return <LoadingScreen progress={loadingMessage} />;
  }

  // App is ready - render routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/record"
          element={
            <Record
              piecesModelRef={piecesModelRef}
              xcornersModelRef={xcornersModelRef}
            />
          }
        />
        <Route
          path="/upload"
          element={
            <Upload
              piecesModelRef={piecesModelRef}
            />
          }
        />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;