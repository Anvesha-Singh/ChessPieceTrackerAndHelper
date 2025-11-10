import { Chess, Move } from "chess.js";
import type { GameUpdatePayload } from "../types/index";

/**
 * Creates a payload for game updates from the current board state
 * This is used by findPieces when a move is detected
 */
export const makeUpdatePayload = (board: Chess, greedy: boolean = false): GameUpdatePayload => {
  const fen = board.fen();
  
  // Build PGN from moves
  const history = board.history({ verbose: true });
  let pgn = "";
  
  history.forEach((move: Move, index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    
    if (move.color === "w") {
      // White's move - add move number
      pgn += `${moveNumber}. ${move.san} `;
    } else {
      // Black's move
      pgn += `${move.san} `;
    }
  });
  
  return {
    fen,
    pgn: pgn.trim(),
    greedy
  };
};