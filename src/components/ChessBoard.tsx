import { Chess } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  size?: number;
}

export default function ChessBoard({ fen, size = 300 }: ChessBoardProps) {
  const chess = new Chess(fen);
  const board = chess.board();
  const squareSize = size / 8;

  const pieceSymbols: Record<'w' | 'b', Record<string, string>> = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
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
            const isWhitePiece = square?.color === 'w';
            const piece = square ? pieceSymbols[square.color][square.type] : null;

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
                  <span
                    className={isWhitePiece ? 'drop-shadow-lg' : ''}
                    style={{
                      // Prefer monochrome symbol fonts to avoid colored emoji rendering (blue pawns)
                      fontFamily:
                        '"Segoe UI Symbol", "DejaVu Sans", Symbola, "Noto Sans Symbols2", "Arial Unicode MS", sans-serif',
                      color: isWhitePiece ? '#ffffff' : '#111827', // white or slate-900 for black
                    }}
                  >
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
