import { useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { GraphModel } from '@tensorflow/tfjs-converter';
import { Loader } from 'lucide-react';
import CornerMarker from './CornerMarker';
import { findPieces } from '../utils/findPieces';
import { setStatusMessage } from '../store/uiSlice';
import { Chess } from 'chess.js';
import { getMovesPairs } from '../utils/moves';

interface VideoCanvasProps {
  piecesModelRef: React.RefObject<GraphModel | null>;
  xcornersModelRef?: React.RefObject<GraphModel | null>;
}

export default function VideoCanvas({ piecesModelRef, xcornersModelRef: _xcornersModelRef }: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dispatch = useAppDispatch();

  // Redux state
  const corners = useAppSelector((state) => state.corners.positions);
  const isPlaying = useAppSelector((state) => state.ui.isPlaying);
  const { fen, pgn } = useAppSelector((state) => state.game);

  // Refs for the detection loop
  const cornersRef = useRef(corners);
  const isPlayingRef = useRef(isPlaying);
  const boardRef = useRef<Chess>(new Chess(fen));
  const movesPairsRef = useRef<any[]>([]);
  const lastMoveRef = useRef<string>('');
  const moveTextRef = useRef<string>('');

  // Keep refs in sync with state
  useEffect(() => {
    cornersRef.current = corners;
  }, [corners]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const board = new Chess(fen);
    boardRef.current = board;
    movesPairsRef.current = getMovesPairs(board);
  }, [fen, pgn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let stream: MediaStream | null = null;
    let detectionLoopCleanup: (() => void) | null = null;

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
      ctx.setLineDash([]);

      animationFrameId = requestAnimationFrame(draw);
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
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

        // Start the main detection loop once models are loaded
        if (piecesModelRef?.current) {
          detectionLoopCleanup = findPieces(
            piecesModelRef,
            videoRef,
            canvasRef,
            isPlayingRef,
            (textLines: string[]) => {
              dispatch(setStatusMessage(textLines[0])); // Use first line for status
            },
            dispatch,
            cornersRef,
            boardRef,
            movesPairsRef,
            lastMoveRef,
            moveTextRef,
            'record'
          );
        } else {
          dispatch(setStatusMessage('Waiting for models to load...'));
        }

        draw();
      } catch (err) {
        console.error('Camera access error:', err);
        dispatch(setStatusMessage('Error accessing camera'));
      }
    };

    start();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (detectionLoopCleanup) {
        detectionLoopCleanup();
      }
    };
  }, [dispatch, piecesModelRef]);

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay while models are not ready */}
      {!piecesModelRef?.current && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80">
          <div className="flex items-center gap-3 text-slate-200">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading models…</span>
          </div>
        </div>
      )}
      {/* Hidden video element used as source for the canvas */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      />

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