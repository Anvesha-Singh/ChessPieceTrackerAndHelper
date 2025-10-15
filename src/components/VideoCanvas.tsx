import { useRef, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import CornerMarker from './CornerMarker';

export default function VideoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const corners = useAppSelector((state) => state.corners.positions);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawOverlay = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);

      ctx.beginPath();
      ctx.moveTo(corners.a1.x, corners.a1.y);
      ctx.lineTo(corners.h1.x, corners.h1.y);
      ctx.lineTo(corners.h8.x, corners.h8.y);
      ctx.lineTo(corners.a8.x, corners.a8.y);
      ctx.closePath();
      ctx.stroke();
    };

    drawOverlay();
  }, [corners]);

  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full bg-slate-700 flex items-center justify-center rounded-lg overflow-hidden">
        <p className="text-slate-400 text-lg">Camera feed will appear here</p>
      </div>

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
