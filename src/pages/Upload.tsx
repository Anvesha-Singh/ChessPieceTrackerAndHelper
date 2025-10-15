import { useEffect } from 'react';
import VideoCanvas from '../components/VideoCanvas';
import Sidebar from '../components/Sidebar';
import { AlertCircle, Upload as UploadIcon } from 'lucide-react';

export default function Upload() {
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
        <div className="flex-1 p-4">
          <VideoCanvas />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
