import { useRef, useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateCornerPosition } from '../store/cornersSlice';

interface CornerMarkerProps {
  corner: 'a1' | 'h1' | 'a8' | 'h8';
  position: { x: number; y: number };
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export default function CornerMarker({ corner, position, canvasRef }: CornerMarkerProps) {
  const dispatch = useAppDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

      dispatch(updateCornerPosition({ corner, position: { x, y } }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, corner, dispatch, canvasRef]);

  return (
    <div
      ref={markerRef}
      onMouseDown={() => setIsDragging(true)}
      className="absolute w-6 h-6 bg-yellow-400 border-2 border-yellow-600 rounded-full cursor-move shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition z-10"
      style={{ left: position.x, top: position.y }}
    >
      <span className="text-xs font-bold text-slate-900">{corner}</span>
    </div>
  );
}
