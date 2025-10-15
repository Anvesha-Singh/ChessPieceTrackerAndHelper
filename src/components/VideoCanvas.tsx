import { useRef, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import CornerMarker from './CornerMarker';

export default function VideoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const corners = useAppSelector((state) => state.corners.positions);
  const cornersRef = useRef(corners);

  // keep latest corners in a ref so draw loop reads fresh values
  useEffect(() => {
    cornersRef.current = corners;
  }, [corners]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let stream: MediaStream | null = null;

    const draw = () => {
      // Resize canvas to match element size for crisp rendering
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== Math.floor(width) || canvas.height !== Math.floor(height)) {
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the live video frame beneath overlays
      if (video.readyState >= 2) {
        // cover behavior to maintain aspect ratio
        const videoRatio = video.videoWidth / video.videoHeight || 1;
        const canvasRatio = canvas.width / canvas.height || 1;
        let dw = canvas.width;
        let dh = canvas.height;
        let dx = 0;
        let dy = 0;
        if (videoRatio > canvasRatio) {
          // video is wider
          dh = canvas.height;
          dw = dh * videoRatio;
          dx = (canvas.width - dw) / 2;
        } else {
          // video is taller
          dw = canvas.width;
          dh = dw / videoRatio;
          dy = (canvas.height - dh) / 2;
        }
        ctx.drawImage(video, dx, dy, dw, dh);
      }

  // Draw overlay (board polygon)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
  const c = cornersRef.current;
  ctx.moveTo(c.a1.x, c.a1.y);
  ctx.lineTo(c.h1.x, c.h1.y);
  ctx.lineTo(c.h8.x, c.h8.y);
  ctx.lineTo(c.a8.x, c.a8.y);
      ctx.closePath();
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        video.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) return resolve();
          const onLoaded = () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          video.addEventListener('loadedmetadata', onLoaded);
        });
        await video.play();
        draw();
      } catch (err) {
        console.error('Camera access error:', err);
      }
    };

    start();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Hidden video element used as source for the canvas */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      <div className="absolute top-0 left-0 w-full h-full">
        {Object.entries(corners).map(([corner, position]) => (
          <CornerMarker
            key={corner}
            corner={corner as 'a1' | 'h1' | 'a8' | 'h8'}
            position={position}
            canvasRef={canvasRef}
          />
        ))}
      </div>
    </div>
  );
}
