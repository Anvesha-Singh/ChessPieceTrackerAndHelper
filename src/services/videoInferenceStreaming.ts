import * as tf from "@tensorflow/tfjs-core";
import { Chess } from "chess.js";
import { GraphModel } from "@tensorflow/tfjs-converter";
import {
  getBoxesAndScores,
  getInput,
} from "../utils/detect";
import {
  getSquares,
  getUpdate,
} from "../utils/findPieces";
import {
  transformCenters,
  transformBoundary,
  getInvTransform,
} from "../utils/warp";
import { zeros } from "../utils/math";
import { getMovesPairs } from "../utils/moves";
import { CORNER_KEYS } from "../utils/constants";
import type { MovesPair, GameUpdatePayload } from "../types/index";

interface StreamInferenceOptions {
  onProgress?: (progress: number) => void;
  maxMoves?: number;
  cornersOverride?: {
    a1: [number, number];
    h1: [number, number];
    a8: [number, number];
    h8: [number, number];
  };
}

/**
 * Stream video and run inference frame-by-frame without storing frames
 * Similar to the Record page's detection loop but on video file
 */
export const runVideoInferenceStreaming = async (
  piecesModelRef: React.RefObject<GraphModel | null>,
  videoFile: File,
  options: StreamInferenceOptions = {}
): Promise<GameUpdatePayload> => {
  if (!piecesModelRef?.current) {
    throw new Error("Pieces model not loaded");
  }

  const { onProgress, maxMoves = 12 } = options;
  const chess = new Chess();
  let moveCount = 0;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoFile);
    video.preload = "metadata";

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        const fps = 10; // Process 10 FPS for speed/accuracy balance
        const frameInterval = 1 / fps;
        let currentTime = 0;
        let processedFrames = 0;

        // Initialize board detection state (like Record page)
        let centers: number[][] | null = null;
        // boundary points not needed directly here
        let centers3D: tf.Tensor3D;
        let boundary3D: tf.Tensor3D;
        let state: number[][];
        // keypoints are derived per-corner below; no separate mutable needed
        let movesPairs: MovesPair[] = [];
        let possibleMoves: Set<string> = new Set();
        let lastDetectedMove = "";
        let greedyMoveToTime: { [move: string]: number } = {};

        const processFrame = async () => {
          try {
            // Initialize on first frame
            if (centers === null) {
              const cornersData = options.cornersOverride || {
                a1: [50, 400],
                h1: [600, 400],
                a8: [50, 50],
                h8: [600, 50],
              };

              const keypoints = CORNER_KEYS.map((key) => {
                const [x, y] = cornersData[key as keyof typeof cornersData];
                return [x, y];
              });

              const invTransform = getInvTransform(keypoints);
              [centers, centers3D] = transformCenters(invTransform);
              [, boundary3D] = transformBoundary(invTransform);
              state = zeros(64, 12);
              movesPairs = getMovesPairs(chess);
            }

            // Create canvas from current video frame
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              throw new Error("Could not get canvas context");
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const videoWidth = canvas.width;
            const videoHeight = canvas.height;

            // Run detection (same as Record.tsx findPieces loop)
            const { image4D, width, height, padding, roi } = getInput({
              current: canvas,
              videoWidth,
              videoHeight,
            } as any);

            const rawPreds = piecesModelRef.current!.predict(image4D);
            const preds = Array.isArray(rawPreds)
              ? (rawPreds[0] as tf.Tensor3D)
              : (rawPreds as tf.Tensor3D);
            const { boxes, scores } = getBoxesAndScores(
              preds,
              width,
              height,
              videoWidth,
              videoHeight,
              padding,
              roi
            );

            // Process detections
            const squares: number[] = getSquares(boxes, centers3D, boundary3D);
            const update: number[][] = getUpdate(scores, squares);
            state = updateState(state, update);

            const {
              bestScore1,
              bestScore2,
              bestJointScore,
              bestMove,
              bestMoves,
            } = processState(state, movesPairs, possibleMoves);

            let detectedMove: string | null = null;
            const now = Date.now();

            // Dual-move detection (high confidence)
            if (bestMoves !== null && bestScore2 > 0 && bestJointScore > 0) {
              const move = bestMoves.sans[0];
              if (possibleMoves.has(move) && moveCount < maxMoves) {
                detectedMove = move;
                possibleMoves.clear();
                greedyMoveToTime = {};
              }
            }

            // Greedy single-move detection (1 second threshold)
            if (!detectedMove && bestMove !== null && bestScore1 > 0.5 && moveCount < maxMoves) {
              const move = bestMove.sans[0];

              if (!(move in greedyMoveToTime)) {
                greedyMoveToTime[move] = now;
              }

              const secondElapsed = now - greedyMoveToTime[move] > 1000;
              if (secondElapsed && move !== lastDetectedMove) {
                // Validate move
                try {
                  const testChess = new Chess(chess.fen());
                  if (testChess.move(move)) {
                    detectedMove = move;
                    lastDetectedMove = move;
                  }
                } catch {
                  // Invalid move
                }
              }
            }

            // Apply detected move
            if (detectedMove) {
              try {
                chess.move(detectedMove);
                moveCount++;
                movesPairs = getMovesPairs(chess);
                possibleMoves.clear();
              } catch (err) {
                console.warn(`Failed to apply move ${detectedMove}:`, err);
              }
            }

            // Cleanup tensors
            tf.dispose([image4D, preds, boxes, scores]);

            processedFrames++;
            if (onProgress) {
              const progressPercent = (currentTime / duration) * 100;
              onProgress(Math.min(progressPercent, 99));
            }

            // Move to next frame
            currentTime += frameInterval;

            if (currentTime < duration) {
              video.currentTime = currentTime;
            } else {
              // Done processing
              finishProcessing();
            }
          } catch (err) {
            console.error("Error processing frame:", err);
            tf.disposeVariables();
            reject(err);
          }
        };

        const finishProcessing = () => {
          if (onProgress) {
            onProgress(100);
          }

          // Generate PGN
          const pgn = chess
            .history({ verbose: true })
            .map((move, idx) => {
              const moveNum = Math.floor(idx / 2) + 1;
              if (move.color === "w") {
                return `${moveNum}. ${move.san}`;
              } else {
                return move.san;
              }
            })
            .join(" ");

          // Cleanup
          URL.revokeObjectURL(video.src);
          tf.disposeVariables();

          resolve({
            fen: chess.fen(),
            pgn: pgn || "1. e4",
            greedy: false,
          });
        };

        // Start processing loop
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          processFrame();
        };

        video.addEventListener("seeked", onSeeked);
        video.currentTime = 0;
      } catch (err) {
        URL.revokeObjectURL(video.src);
        tf.disposeVariables();
        reject(err);
      }
    };

    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };
  });
};

/**
 * Helper function to update state (from findPieces)
 */
const updateState = (state: number[][], update: number[][], decay: number = 0.5) => {
  for (let i = 0; i < 64; i++) {
    for (let j = 0; j < 12; j++) {
      state[i][j] = decay * state[i][j] + (1 - decay) * update[i][j];
    }
  }
  return state;
};

/**
 * Helper function to process state (from findPieces)
 */
const processState = (
  state: any,
  movesPairs: MovesPair[],
  possibleMoves: Set<string>
): {
  bestScore1: number;
  bestScore2: number;
  bestJointScore: number;
  bestMove: any;
  bestMoves: any;
} => {
  let bestScore1 = Number.NEGATIVE_INFINITY;
  let bestScore2 = Number.NEGATIVE_INFINITY;
  let bestJointScore = Number.NEGATIVE_INFINITY;
  let bestMove: any = null;
  let bestMoves: any = null;
  const seen: Set<string> = new Set();

  movesPairs.forEach((movePair) => {
    if (!(movePair.move1.sans[0] in seen)) {
      seen.add(movePair.move1.sans[0]);
      const score = calculateScore(state, movePair.move1);
      if (score > 0) {
        possibleMoves.add(movePair.move1.sans[0]);
      }
      if (score > bestScore1) {
        bestMove = movePair.move1;
        bestScore1 = score;
      }
    }

    if (
      movePair.move2 === null ||
      movePair.moves === null ||
      !possibleMoves.has(movePair.move1.sans[0])
    ) {
      return;
    }

    const score2: number = calculateScore(state, movePair.move2);
    if (score2 < 0) {
      return;
    } else if (score2 > bestScore2) {
      bestScore2 = score2;
    }

    const jointScore: number = calculateScore(state, movePair.moves);
    if (jointScore > bestJointScore) {
      bestJointScore = jointScore;
      bestMoves = movePair.moves;
    }
  });

  return { bestScore1, bestScore2, bestJointScore, bestMove, bestMoves };
};

/**
 * Calculate score for a move (from findPieces)
 */
const calculateScore = (state: any, move: any, from_thr = 0.6, to_thr = 0.6) => {
  let score = 0;
  move.from.forEach((square: number) => {
    score += 1 - Math.max(...state[square]) - from_thr;
  });

  for (let i = 0; i < move.to.length; i++) {
    score += state[move.to[i]][move.targets[i]] - to_thr;
  }

  return score;
};