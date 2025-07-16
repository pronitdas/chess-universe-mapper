// Chess utility functions for the slippy map

export interface ChessPosition {
  fen: string;
  moves: string[];
  metadata: {
    games: number;
    avgElo: number;
    winRate: number;
  };
}

export interface TileCoords {
  x: number;
  y: number;
  z: number;
}

// Starting position FEN
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Common chess openings mapped to coordinates
const OPENING_POSITIONS: { [key: string]: string[] } = {
  '0,0,0': ['e4'],
  '0,1,0': ['d4'],
  '0,2,0': ['Nf3'],
  '0,3,0': ['c4'],
  '0,4,0': ['g3'],
  '0,5,0': ['f4'],
  '0,6,0': ['b3'],
  '0,7,0': ['Nc3'],
  '1,0,1': ['e4', 'e5'],
  '1,1,1': ['e4', 'c5'],
  '1,2,1': ['d4', 'd5'],
  '1,3,1': ['Nf3', 'Nf6'],
  '1,4,1': ['c4', 'e5'],
  '1,5,1': ['g3', 'g6'],
  '1,6,1': ['f4', 'f5'],
  '1,7,1': ['b3', 'b6'],
  '2,0,2': ['e4', 'e5', 'Nf3'],
  '2,1,2': ['e4', 'c5', 'Nf3'],
  '2,2,2': ['d4', 'd5', 'c4'],
  '2,3,2': ['Nf3', 'Nf6', 'c4']
};

// Generate a deterministic move sequence from tile coordinates
export function coordinatesToMoves(coords: TileCoords): string[] {
  const key = `${coords.z},${coords.x},${coords.y}`;
  
  // Check if we have a predefined opening
  if (OPENING_POSITIONS[key]) {
    return OPENING_POSITIONS[key];
  }
  
  // Generate moves deterministically from coordinates
  const moves: string[] = [];
  let { x, y, z } = coords;
  
  // Use a simple hash to generate consistent moves
  const hash = (x + y * 1000 + z * 1000000) % 1000000;
  
  // Basic move generation (simplified for demo)
  for (let i = 0; i < Math.min(z + 1, 10); i++) {
    const moveIndex = (hash + i * 123) % MOVE_POOL.length;
    moves.push(MOVE_POOL[moveIndex]);
  }
  
  return moves;
}

// Pool of possible moves for generation
const MOVE_POOL = [
  'e4', 'd4', 'Nf3', 'c4', 'g3', 'f4', 'b3', 'Nc3',
  'e5', 'c5', 'd5', 'Nf6', 'g6', 'f5', 'b6', 'Nc6',
  'Bb5', 'Bc4', 'Be2', 'Bd3', 'Bg2', 'Bf4', 'Bb2',
  'O-O', 'O-O-O', 'Qd2', 'Qe2', 'Qf3', 'Qg4', 'Qh4',
  'Rd1', 'Re1', 'Rf1', 'Rg1', 'Rh1', 'Ra1', 'Rb1',
  'Kh1', 'Kg1', 'Kf1', 'Ke1', 'Kd1', 'Kc1', 'Kb1'
];

// Generate chess position from tile coordinates
export function generateChessPosition(coords: TileCoords): ChessPosition {
  const moves = coordinatesToMoves(coords);
  
  // Apply moves to get FEN (simplified - in real implementation would apply actual moves)
  const fen = applyMovesToFEN(START_FEN, moves);
  
  // Generate metadata based on coordinates
  const metadata = generateMetadata(coords);
  
  return {
    fen,
    moves,
    metadata
  };
}

// Simplified FEN generation (in real implementation would apply actual chess rules)
function applyMovesToFEN(startFen: string, moves: string[]): string {
  // For demo purposes, we'll modify the FEN slightly based on moves
  // In a real implementation, this would apply actual chess moves
  
  if (moves.length === 0) return startFen;
  
  // Simple modification - just change the move counter
  const parts = startFen.split(' ');
  parts[5] = Math.min(parseInt(parts[5]) + moves.length, 50).toString();
  
  return parts.join(' ');
}

// Generate realistic metadata for a position
function generateMetadata(coords: TileCoords): ChessPosition['metadata'] {
  const { x, y, z } = coords;
  
  // Use coordinates to generate deterministic but realistic-looking data
  const seed = x + y * 1000 + z * 1000000;
  
  // Generate games count (more games for lower zoom levels)
  const baseGames = Math.max(1, (10 - z) * 100);
  const games = baseGames + (seed % 1000);
  
  // Generate average ELO (higher for popular openings)
  const baseElo = 1800 + (z * 50); // More complex positions have higher ELO
  const avgElo = baseElo + (seed % 400);
  
  // Generate win rate (around 50% with some variation)
  const winRate = 35 + (seed % 30);
  
  return {
    games,
    avgElo,
    winRate
  };
}

// Convert moves to tile coordinates (reverse operation)
export function movesToCoordinates(moves: string[], zoom: number): TileCoords {
  // Hash the moves to get consistent coordinates
  let hash = 0;
  const moveString = moves.join(',');
  
  for (let i = 0; i < moveString.length; i++) {
    const char = moveString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Map to tile space
  const tileCount = Math.pow(2, zoom);
  const x = Math.abs(hash % tileCount);
  const y = Math.abs((hash >> 16) % tileCount);
  
  return { x, y, z: zoom };
}

// Generate SVG for a chess tile
export function generateTileSVG(position: ChessPosition, size: number = 256): string {
  const { metadata } = position;
  
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#1a1a1a" stroke="#4ecdc4" stroke-width="2"/>
      
      <!-- Mini chess board -->
      <g transform="translate(68, 40)">
        ${generateMiniBoard(120)}
      </g>
      
      <!-- Statistics -->
      <text x="${size/2}" y="${size - 80}" text-anchor="middle" fill="white" font-size="16" font-weight="bold">
        ${metadata.games.toLocaleString()} games
      </text>
      <text x="${size/2}" y="${size - 60}" text-anchor="middle" fill="#888" font-size="14">
        ELO: ${metadata.avgElo}
      </text>
      <text x="${size/2}" y="${size - 40}" text-anchor="middle" fill="#888" font-size="14">
        Win: ${metadata.winRate}%
      </text>
    </svg>
  `;
}

// Generate mini chess board SVG
function generateMiniBoard(size: number): string {
  const squareSize = size / 8;
  let boardSVG = '';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const color = isLight ? '#f0d9b5' : '#b58863';
      
      boardSVG += `
        <rect x="${col * squareSize}" y="${row * squareSize}" 
              width="${squareSize}" height="${squareSize}" 
              fill="${color}" />
      `;
    }
  }
  
  return boardSVG;
}