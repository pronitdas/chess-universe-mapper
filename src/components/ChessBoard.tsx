import React from 'react';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  fen: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ fen, size = 'md', className }) => {
  const pieces = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
  };

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };

  const squareSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  // Parse FEN to get board position
  const parseFEN = (fen: string) => {
    const [boardStr] = fen.split(' ');
    const rows = boardStr.split('/');
    const board = [];
    
    for (let row = 0; row < 8; row++) {
      const currentRow = [];
      let col = 0;
      
      for (const char of rows[row]) {
        if (isNaN(Number(char))) {
          currentRow.push(char);
          col++;
        } else {
          for (let i = 0; i < parseInt(char); i++) {
            currentRow.push(null);
            col++;
          }
        }
      }
      board.push(currentRow);
    }
    
    return board;
  };

  const board = parseFEN(fen);

  return (
    <div className={cn(
      'grid grid-cols-8 gap-0 border-2 border-chess-border rounded-lg overflow-hidden shadow-lg',
      sizeClasses[size],
      className
    )}>
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isLight = (rowIndex + colIndex) % 2 === 0;
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                'flex items-center justify-center aspect-square cursor-pointer transition-all duration-200 hover:scale-110',
                isLight ? 'bg-chess-light' : 'bg-chess-dark',
                squareSizes[size]
              )}
            >
              {piece && (
                <span className="text-gray-900 font-bold select-none">
                  {pieces[piece as keyof typeof pieces]}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChessBoard;