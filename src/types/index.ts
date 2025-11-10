import { Square } from "chess.js";

export type Mode = "record" | "upload" | "play";
export type CornersKey = "a1" | "h1" | "a8" | "h8";

export interface MovesData {
  sans: string[];
  from: number[];
  to: number[];
  targets: number[];
}

export interface MovesPair {
  move1: MovesData;
  move2: MovesData | null;
  moves: MovesData | null;
}

export interface CornersDict {
  a1: number[];
  h1: number[];
  a8: number[];
  h8: number[];
}

export interface CornersPayload {
  xy: { x: number; y: number };
  key: CornersKey;
}

export interface GameUpdatePayload {
  fen: string;
  pgn: string;
  greedy?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface CornersStatePosition {
  a1: Position;
  h1: Position;
  a8: Position;
  h8: Position;
}