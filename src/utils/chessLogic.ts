export interface ChessPosition {
  fen: string;
  moves: string[];
  metadata: {
    games: number;
    avgElo: number;
    winRate: number;
    evaluation: number;
    phase: 'opening' | 'middlegame' | 'endgame';
    universe: string;
    depth: number;
    parentCoords?: { x: number; y: number; z: number };
    childCoords?: { x: number; y: number; z: number }[];
  };
}

export interface TileCoords {
  x: number;
  y: number;
  z: number;
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const PHASES = ['opening', 'middlegame', 'endgame'] as const;

const UNIVERSE_NAMES = [
  'Classical', 'Hypermodern', 'Romantic', 'Computer', 'Blitz', 'Bullet',
  'Correspondence', 'Fischer', 'Alekhine', 'Capablanca', 'Morphy', 'Nimzowitsch',
  'Steinitz', 'Lasker', 'Botvinnik', 'Tal', 'Petrosian', 'Spassky',
  'Karpov', 'Kasparov', 'Deep Blue', 'AlphaZero', 'Stockfish'
];

const MOVE_TREE: { [key: string]: string[] } = {
  'root': ['e4', 'd4', 'Nf3', 'c4', 'g3', 'f4', 'b3', 'Nc3', 'e3', 'd3', 'a3', 'h3'],
  'e4': ['e5', 'c5', 'e6', 'c6', 'd5', 'Nf6', 'g6', 'd6', 'Nc6'],
  'd4': ['d5', 'Nf6', 'e6', 'c5', 'c6', 'g6', 'f5', 'd6'],
  'Nf3': ['Nf6', 'd5', 'c5', 'g6', 'e6', 'd6', 'b6', 'c6'],
  'c4': ['e5', 'Nf6', 'c5', 'e6', 'g6', 'd5', 'c6'],
  'g3': ['d5', 'Nf6', 'e5', 'c5', 'g6', 'd6', 'e6'],
  'f4': ['d5', 'Nf6', 'c5', 'e6', 'g6', 'c6'],
  'b3': ['e5', 'd5', 'Nf6', 'c5', 'g6', 'e6'],
  'Nc3': ['d5', 'Nf6', 'e5', 'c5', 'e6', 'g6'],
  'e3': ['d5', 'Nf6', 'e5', 'c5', 'g6'],
  'd3': ['d5', 'Nf6', 'e5', 'c5', 'g6'],
  'e5': ['Nf3', 'Nc3', 'Bc4', 'Bb5', 'd3', 'f4'],
  'c5': ['Nf3', 'Nc3', 'c3', 'd4', 'e3', 'g3'],
  'e6': ['d4', 'Nf3', 'c4', 'Nc3', 'e3'],
  'c6': ['d4', 'Nc3', 'e4', 'Nf3', 'c4'],
  'd5': ['c4', 'Nf3', 'Nc3', 'e3', 'g3', 'Bf4'],
  'Nf6': ['c4', 'Nc3', 'd4', 'Nf3', 'g3', 'e3'],
  'g6': ['d4', 'Nf3', 'c4', 'g3', 'e4'],
  'd6': ['d4', 'Nf3', 'c4', 'e4', 'Nc3'],
  'Nc6': ['Nf3', 'Bb5', 'Bc4', 'Nc3', 'd4'],
  'Bc5': ['c3', 'Nf3', 'd4', 'Nc3', 'a3'],
  'Bb5': ['a6', 'Nc6', 'Nf6', 'Bc5', 'd6'],
  'Bc4': ['Nf6', 'Nc6', 'Bc5', 'd6', 'c6'],
  'c3': ['d5', 'Nf6', 'g6', 'e6', 'd6'],
};

function getPhaseFromPly(ply: number): typeof PHASES[number] {
  if (ply <= 10) return 'opening';
  if (ply <= 40) return 'middlegame';
  return 'endgame';
}

function getUniverseName(x: number, y: number, z: number): string {
  const hash = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
  const index = Math.abs(hash) % UNIVERSE_NAMES.length;
  return UNIVERSE_NAMES[index];
}

function hilbertXY2D(n: number, x: number, y: number): number {
  let rx: number, ry: number, s: number;
  let d = 0;
  for (s = n / 2; s > 0; s /= 2) {
    rx = (x & s) > 0 ? 1 : 0;
    ry = (y & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        x = n - 1 - x;
        y = n - 1 - y;
      }
      const t = x;
      x = y;
      y = t;
    }
  }
  return d;
}

function hilbertD2XY(n: number, d: number): [number, number] {
  let rx: number, ry: number, s: number, t = d;
  let x = 0, y = 0;
  for (s = 1; s < n; s *= 2) {
    rx = 1 & (t / 2);
    ry = 1 & (t ^ rx);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const tmp = x;
      x = y;
      y = tmp;
    }
    x += s * rx;
    y += s * ry;
    t /= 4;
  }
  return [x, y];
}

function generateMoveSequence(x: number, y: number, z: number): string[] {
  const moves: string[] = [];
  const depth = z;
  
  if (depth === 0) return moves;
  
  const n = Math.max(256, 1 << (Math.ceil(Math.log2(Math.max(x, y, 16)))));
  const hilbertIndex = hilbertXY2D(n, Math.abs(x) % n, Math.abs(y) % n);
  
  let currentKey = 'root';
  let rng = hilbertIndex + (z * 1234567);
  
  const rngNext = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng;
  };
  
  for (let i = 0; i < depth; i++) {
    const availableMoves = MOVE_TREE[currentKey] || MOVE_TREE['root'];
    if (availableMoves.length === 0) break;
    
    const moveIndex = rngNext() % availableMoves.length;
    const move = availableMoves[moveIndex];
    moves.push(move);
    
    if (MOVE_TREE[move]) {
      currentKey = move;
    } else {
      const responses = MOVE_TREE['root'].filter(m => !moves.includes(m));
      currentKey = responses.length > 0 ? responses[rngNext() % responses.length] : 'root';
    }
  }
  
  return moves;
}

function parseFEN(fen: string): {
  board: string[][];
  activeColor: 'w' | 'b';
  castling: string;
  enPassant: string;
  halfmove: number;
  fullmove: number;
} {
  const parts = fen.split(' ');
  const boardStr = parts[0];
  const rows = boardStr.split('/');
  const board: string[][] = [];
  
  for (let row = 0; row < 8; row++) {
    const currentRow: string[] = [];
    const rowStr = rows[row] || '';
    
    for (const char of rowStr) {
      if (isNaN(Number(char))) {
        currentRow.push(char);
      } else {
        const emptyCount = parseInt(char);
        for (let i = 0; i < emptyCount; i++) {
          currentRow.push('.');
        }
      }
    }
    
    while (currentRow.length < 8) {
      currentRow.push('.');
    }
    
    board.push(currentRow);
  }
  
  return {
    board,
    activeColor: parts[1] as 'w' | 'b',
    castling: parts[2] || '-',
    enPassant: parts[3] || '-',
    halfmove: parseInt(parts[4] || '0'),
    fullmove: parseInt(parts[5] || '1')
  };
}

function boardToFEN(
  board: string[][],
  activeColor: 'w' | 'b',
  castling: string,
  enPassant: string,
  halfmove: number,
  fullmove: number
): string {
  const rows: string[] = [];
  
  for (let row = 0; row < 8; row++) {
    let rowStr = '';
    let emptyCount = 0;
    
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece === '.') {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        rowStr += piece;
      }
    }
    
    if (emptyCount > 0) {
      rowStr += emptyCount;
    }
    
    rows.push(rowStr);
  }
  
  return `${rows.join('/')} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

function fileToCol(file: string): number {
  return file.charCodeAt(0) - 'a'.charCodeAt(0);
}

function rankToRow(rank: string): number {
  return 8 - parseInt(rank);
}

function isValidPieceMove(pieceType: string, fromCol: number, fromRow: number, toCol: number, toRow: number): boolean {
  const dCol = Math.abs(toCol - fromCol);
  const dRow = Math.abs(toRow - fromRow);
  
  switch (pieceType) {
    case 'N':
      return (dCol === 2 && dRow === 1) || (dCol === 1 && dRow === 2);
    case 'B':
      return dCol === dRow && dCol > 0;
    case 'R':
      return dCol === 0 || dRow === 0;
    case 'Q':
      return dCol === dRow || dCol === 0 || dRow === 0;
    case 'K':
      return dCol <= 1 && dRow <= 1;
    default:
      return false;
  }
}

function applyMove(
  board: string[][],
  move: string,
  color: 'w' | 'b'
): { board: string[][]; capture: boolean } {
  const newBoard = board.map(row => [...row]);
  let capture = false;
  
  if (move === 'O-O') {
    if (color === 'w') {
      newBoard[7][4] = '.';
      newBoard[7][7] = '.';
      newBoard[7][6] = 'K';
      newBoard[7][5] = 'R';
    } else {
      newBoard[0][4] = '.';
      newBoard[0][7] = '.';
      newBoard[0][6] = 'k';
      newBoard[0][5] = 'r';
    }
    return { board: newBoard, capture: false };
  }
  
  if (move === 'O-O-O') {
    if (color === 'w') {
      newBoard[7][4] = '.';
      newBoard[7][0] = '.';
      newBoard[7][2] = 'K';
      newBoard[7][3] = 'R';
    } else {
      newBoard[0][4] = '.';
      newBoard[0][0] = '.';
      newBoard[0][2] = 'k';
      newBoard[0][3] = 'r';
    }
    return { board: newBoard, capture: false };
  }
  
  const pieceMatch = move.match(/^([NBRQK])([a-h])?([1-8])?([x])?([a-h][1-8])$/);
  const pawnMatch = move.match(/^([a-h])([1-8])?([x])?([a-h])?([1-8])?(=[NBRQ])?$/);
  
  if (pieceMatch) {
    const [, pieceType, fromFile, fromRank, captureStr, toSquare] = pieceMatch;
    const toCol = fileToCol(toSquare[0]);
    const toRow = rankToRow(toSquare[1]);
    const pieceChar = color === 'w' ? pieceType : pieceType.toLowerCase();
    
    if (newBoard[toRow][toCol] !== '.') {
      capture = true;
    }
    
    let fromCol = -1;
    let fromRow = -1;
    
    if (fromFile) {
      fromCol = fileToCol(fromFile);
    }
    if (fromRank) {
      fromRow = rankToRow(fromRank);
    }
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c] === pieceChar) {
          if (fromCol !== -1 && c !== fromCol) continue;
          if (fromRow !== -1 && r !== fromRow) continue;
          
          if (isValidPieceMove(pieceType, c, r, toCol, toRow)) {
            fromCol = c;
            fromRow = r;
            break;
          }
        }
      }
      if (fromCol !== -1 && fromRow !== -1) break;
    }
    
    if (fromCol !== -1 && fromRow !== -1) {
      newBoard[fromRow][fromCol] = '.';
      newBoard[toRow][toCol] = pieceChar;
    }
  } else if (pawnMatch) {
    const [, fromFile, toRank, captureStr, captureFile, captureRank, promotion] = pawnMatch;
    const pawnChar = color === 'w' ? 'P' : 'p';
    const direction = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    
    if (captureStr && captureFile) {
      const toCol = fileToCol(captureFile);
      const toRow = rankToRow(captureRank || toRank || '8');
      const fromCol = fileToCol(fromFile);
      
      for (let r = 0; r < 8; r++) {
        if (newBoard[r][fromCol] === pawnChar && Math.abs(r - toRow) === 1) {
          if (newBoard[toRow][toCol] !== '.') {
            capture = true;
          }
          newBoard[r][fromCol] = '.';
          if (promotion) {
            const promoPiece = promotion[1];
            newBoard[toRow][toCol] = color === 'w' ? promoPiece : promoPiece.toLowerCase();
          } else {
            newBoard[toRow][toCol] = pawnChar;
          }
          break;
        }
      }
    } else {
      const toCol = fileToCol(fromFile);
      const toRow = rankToRow(toRank || (color === 'w' ? '8' : '1'));
      
      for (let r = 0; r < 8; r++) {
        if (newBoard[r][toCol] === pawnChar) {
          const canMoveOne = r + direction === toRow;
          const canMoveTwo = r === startRow && r + direction * 2 === toRow;
          
          if (canMoveOne || canMoveTwo) {
            newBoard[r][toCol] = '.';
            if (promotion) {
              const promoPiece = promotion[1];
              newBoard[toRow][toCol] = color === 'w' ? promoPiece : promoPiece.toLowerCase();
            } else {
              newBoard[toRow][toCol] = pawnChar;
            }
            break;
          }
        }
      }
    }
  }
  
  return { board: newBoard, capture };
}

function updateCastlingRights(castling: string, move: string, color: 'w' | 'b'): string {
  let newCastling = castling;
  
  if (move === 'O-O' || move === 'O-O-O' || (move.startsWith('K') && move.length === 3)) {
    if (color === 'w') {
      newCastling = newCastling.replace('K', '').replace('Q', '');
    } else {
      newCastling = newCastling.replace('k', '').replace('q', '');
    }
  }
  
  if (move.includes('Rh1')) {
    newCastling = newCastling.replace('K', '');
  } else if (move.includes('Ra1')) {
    newCastling = newCastling.replace('Q', '');
  } else if (move.includes('Rh8')) {
    newCastling = newCastling.replace('k', '');
  } else if (move.includes('Ra8')) {
    newCastling = newCastling.replace('q', '');
  }
  
  return newCastling || '-';
}

function applyMovesToFEN(startFen: string, moves: string[]): string {
  if (moves.length === 0) return startFen;
  
  let state = parseFEN(startFen);
  
  for (const move of moves) {
    const result = applyMove(state.board, move, state.activeColor);
    state.board = result.board;
    state.castling = updateCastlingRights(state.castling, move, state.activeColor);
    
    if (result.capture || move.match(/^[a-h]/)) {
      state.halfmove = 0;
    } else {
      state.halfmove++;
    }
    
    if (state.activeColor === 'b') {
      state.fullmove++;
    }
    
    state.activeColor = state.activeColor === 'w' ? 'b' : 'w';
  }
  
  return boardToFEN(
    state.board,
    state.activeColor,
    state.castling,
    state.enPassant,
    state.halfmove,
    state.fullmove
  );
}

function calculatePositionEvaluation(board: string[][]): number {
  const pieceValues: { [key: string]: number } = {
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0,
    'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': 0
  };
  
  let evaluation = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece !== '.' && pieceValues[piece]) {
        evaluation += pieceValues[piece];
      }
    }
  }
  
  return Math.max(-10, Math.min(10, evaluation));
}

function generateMetadata(coords: TileCoords, fen: string, moves: string[]): ChessPosition['metadata'] {
  const { x, y, z } = coords;
  const seed = hilbertXY2D(256, Math.abs(x) % 256, Math.abs(y) % 256) + z * 1000000;
  
  const boardState = parseFEN(fen);
  const evaluation = calculatePositionEvaluation(boardState.board);
  const phase = getPhaseFromPly(moves.length);
  const universe = getUniverseName(x, y, z);
  
  const baseGames = Math.max(1, (20 - z) * 50);
  const games = baseGames + (seed % 10000);
  
  const baseElo = 1200 + (z * 50);
  const eloVariation = 800;
  const avgElo = baseElo + (seed % eloVariation);
  
  const winRate = evaluation > 0 
    ? 55 + (evaluation * 2) + (seed % 10)
    : 45 + (evaluation * 2) - (seed % 10);
  
  return {
    games,
    avgElo,
    winRate: Math.max(5, Math.min(95, winRate)),
    evaluation,
    phase,
    universe,
    depth: z
  };
}

export function generateChessPosition(coords: TileCoords): ChessPosition {
  const moves = generateMoveSequence(coords.x, coords.y, coords.z);
  const fen = applyMovesToFEN(START_FEN, moves);
  const metadata = generateMetadata(coords, fen, moves);
  
  return {
    fen,
    moves,
    metadata
  };
}

export function getRelatedPositions(coords: TileCoords): TileCoords[] {
  const related: TileCoords[] = [];
  
  if (coords.z > 0) {
    related.push({ x: coords.x, y: coords.y, z: coords.z - 1 });
  }
  
  if (coords.z < 20) {
    related.push({ x: coords.x, y: coords.y, z: coords.z + 1 });
  }
  
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dx, dy] of directions) {
    related.push({ x: coords.x + dx, y: coords.y + dy, z: coords.z });
  }
  
  return related;
}

export function coordinatesToMoves(coords: TileCoords): string[] {
  return generateMoveSequence(coords.x, coords.y, coords.z);
}

export function movesToCoordinates(moves: string[], zoom: number): TileCoords {
  let hash = 0;
  const moveString = moves.join(',');
  
  for (let i = 0; i < moveString.length; i++) {
    const char = moveString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const n = Math.max(256, 1 << Math.ceil(Math.log2(zoom + 16)));
  const [x, y] = hilbertD2XY(n, Math.abs(hash) % (n * n));
  
  return { x, y, z: zoom };
}

const PIECE_SYMBOLS: { [key: string]: string } = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

function getPhaseColor(phase: string): { hue: number; saturation: number } {
  switch (phase) {
    case 'opening':
      return { hue: 120, saturation: 70 };
    case 'middlegame':
      return { hue: 200, saturation: 80 };
    case 'endgame':
      return { hue: 280, saturation: 60 };
    default:
      return { hue: 180, saturation: 50 };
  }
}

function getDepthGlow(z: number): string {
  const intensity = Math.min(1, z / 10);
  return `rgba(255, 215, 0, ${intensity * 0.5})`;
}

export function generateTileDataURL(coords: TileCoords): string {
  const position = generateChessPosition(coords);
  const size = 256;
  const { hue, saturation } = getPhaseColor(position.metadata.phase);
  
  const evaluationColor = position.metadata.evaluation > 0
    ? `hsl(120, 70%, ${50 + position.metadata.evaluation * 3}%)`
    : position.metadata.evaluation < 0
    ? `hsl(0, 70%, ${50 - position.metadata.evaluation * 3}%)`
    : 'hsl(200, 50%, 50%)';
  
  const bgGradient = `
    radial-gradient(circle at center, 
      ${evaluationColor} 0%, 
      hsl(${hue}, ${saturation}%, 20%) 70%, 
      hsl(${hue}, ${saturation}%, 10%) 100%
    )
  `;
  
  const glowColor = getDepthGlow(coords.z);
  const boardState = parseFEN(position.fen);
  const boardSize = 180;
  const squareSize = boardSize / 8;
  const boardOffset = (size - boardSize) / 2;
  
  let boardSVG = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const squareColor = isLight ? '#e8d5b5' : '#b58863';
      const x = boardOffset + col * squareSize;
      const y = boardOffset + row * squareSize;
      
      boardSVG += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${squareColor}"/>`;
      
      const piece = boardState.board[row][col];
      if (piece !== '.') {
        const pieceSymbol = PIECE_SYMBOLS[piece] || '';
        boardSVG += `
          <text x="${x + squareSize/2}" y="${y + squareSize/1.6}" 
                font-size="${squareSize * 0.85}" text-anchor="middle" 
                fill="#1a1a2e" font-weight="bold"
                style="text-shadow: 1px 1px 2px rgba(255,255,255,0.5);"
                font-family="Arial, sans-serif">${pieceSymbol}</text>
        `;
      }
    }
  }
  
  const phaseIcon = position.metadata.phase === 'opening' ? '⚡' :
                   position.metadata.phase === 'middlegame' ? '🔥' : '💎';
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg-${coords.x}-${coords.y}-${coords.z}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${evaluationColor}"/>
          <stop offset="70%" stop-color="hsl(${hue}, ${saturation}%, 25%)"/>
          <stop offset="100%" stop-color="hsl(${hue}, ${saturation}%, 15%)"/>
        </radialGradient>
        <filter id="glow-${coords.z}">
          <feGaussianBlur stdDeviation="${coords.z > 5 ? '8' : '3'}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect width="${size}" height="${size}" fill="url(#bg-${coords.x}-${coords.y}-${coords.z})"/>
      
      ${coords.z > 3 ? `<rect width="${size}" height="${size}" fill="${glowColor}" style="mix-blend-mode: overlay;"/>` : ''}
      
      <rect x="${boardOffset - 4}" y="${boardOffset - 4}" width="${boardSize + 8}" height="${boardSize + 8}" 
            fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="4"/>
      
      ${boardSVG}
      
      <rect x="${boardOffset}" y="${boardOffset}" width="${boardSize}" height="${boardSize}" 
            fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
      
      <rect x="10" y="10" width="${size - 20}" height="30" rx="4" fill="rgba(0,0,0,0.6)"/>
      <text x="${size/2}" y="32" text-anchor="middle" fill="#ffd700" font-family="monospace" font-size="14" font-weight="bold">
        ${phaseIcon} ${position.metadata.universe} Universe
      </text>
      
      <rect x="10" y="${size - 45}" width="${size - 20}" height="35" rx="4" fill="rgba(0,0,0,0.7)"/>
      <text x="${size/2}" y="${size - 28}" text-anchor="middle" fill="white" font-family="monospace" font-size="11">
        ${position.metadata.avgElo} ELO • Depth: ${coords.z}
      </text>
      <text x="${size/2}" y="${size - 15}" text-anchor="middle" fill="#aaa" font-family="monospace" font-size="9">
        ${position.moves.slice(-2).join(', ') || 'Start'}
      </text>
    </svg>
  `;
  
  const encoded = encodeURIComponent(svg)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/'/g, '%27');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function generateMiniBoard(fen: string, size: number = 64): string {
  const boardState = parseFEN(fen);
  const squareSize = size / 8;
  
  let boardSVG = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isLight = (row + col) % 2 === 0;
      const color = isLight ? '#f0d9b5' : '#b58863';
      
      boardSVG += `
        <rect x="${col * squareSize}" y="${row * squareSize}" 
              width="${squareSize}" height="${squareSize}" 
              fill="${color}" />
      `;
      
      const piece = boardState.board[row][col];
      if (piece !== '.') {
        const pieceSymbol = PIECE_SYMBOLS[piece] || '';
        const textColor = piece === piece.toUpperCase() ? '#ffffff' : '#000000';
        boardSVG += `
          <text x="${col * squareSize + squareSize/2}" y="${row * squareSize + squareSize/1.5}" 
                font-size="${squareSize * 0.7}" text-anchor="middle" fill="${textColor}">${pieceSymbol}</text>
        `;
      }
    }
  }
  
  boardSVG += '</svg>';
  return boardSVG;
}
