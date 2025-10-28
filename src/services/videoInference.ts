import { Chess } from 'chess.js';

export interface InferenceResult {
  pgn: string;
  finalFen: string;
  sanMoves: string[];
}

export interface InferenceOptions {
  onProgress?: (value: number) => void;
  maxMoves?: number; // for demo purposes
}

// Stub inference: simulate extracting moves from a video by applying a small
// deterministic sequence. Replace this with a real model pipeline later.
export async function inferPGNFromVideo(
  _file: File,
  options: InferenceOptions = {}
): Promise<InferenceResult> {
  const { onProgress, maxMoves = 12 } = options;

  const chess = new Chess();
  const scripted = [
    'e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+'
  ];

  const moves = scripted.slice(0, maxMoves);

  // Simulated processing with progress updates
  for (let i = 0; i < moves.length; i++) {
    await sleep(200); // pretend to process frames
    const mv = moves[i];
    try {
      chess.move(mv);
    } catch {
      // if SAN fails (shouldn't with this script), try as UCI
      try {
        const uci = sanToPotentialUci(mv);
        if (uci) chess.move(uci);
      } catch {
        // ignore invalid
      }
    }
    onProgress?.(Math.round(((i + 1) / moves.length) * 100));
  }

  // Build a compact PGN string (no headers)
  const sanHistory = chess.history();
  const pgn = buildCompactPGN(sanHistory);
  return { pgn, finalFen: chess.fen(), sanMoves: sanHistory };
}

function buildCompactPGN(sanMoves: string[]): string {
  let out: string[] = [];
  for (let i = 0; i < sanMoves.length; i += 2) {
    const moveNumber = i / 2 + 1;
    const whiteMove = sanMoves[i];
    const blackMove = sanMoves[i + 1];
    if (blackMove) {
      out.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    } else {
      out.push(`${moveNumber}. ${whiteMove}`);
    }
  }
  return out.join(' ');
}

function sanToPotentialUci(_san: string): string | null {
  return null; // not needed for scripted demo
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
