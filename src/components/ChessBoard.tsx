import { Chess } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  size?: number;
}

export default function ChessBoard({ fen, size = 300 }: ChessBoardProps) {
  const chess = new Chess(fen);
  const board = chess.board();
  const squareSize = size / 8;

  const pieceSymbols: Record<string, string> = {
    'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚',
    'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
  };

  return (
    <div
      className="inline-block border-4 border-slate-700 rounded"
      style={{ width: size, height: size }}
    >
      {board.map((row, i) => (
        <div key={i} className="flex">
          {row.map((square, j) => {
            const isLight = (i + j) % 2 === 0;
            const piece = square ? pieceSymbols[square.type === square.type.toUpperCase() ? square.type.toUpperCase() : square.type] : null;
            const isWhitePiece = square?.color === 'w';

            return (
              <div
                key={`${i}-${j}`}
                className={`flex items-center justify-center ${
                  isLight ? 'bg-slate-300' : 'bg-slate-600'
                }`}
                style={{
                  width: squareSize,
                  height: squareSize,
                  fontSize: squareSize * 0.7,
                }}
              >
                {piece && (
                  <span className={isWhitePiece ? 'text-white drop-shadow-lg' : 'text-black'}>
                    {piece}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
