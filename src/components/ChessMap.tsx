import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { generateChessPosition, ChessPosition, TileCoords } from '@/utils/chessLogic';
import PositionPanel from './PositionPanel';
import ControlPanel from './ControlPanel';
import StatusPanel from './StatusPanel';
import TileInfo from './TileInfo';
import { cn } from '@/lib/utils';

// Custom tile layer for chess positions
class ChessTileLayer extends L.TileLayer {
  private loadedTiles: Map<string, ChessPosition> = new Map();
  private onTileUpdate: (tileKey: string, position: ChessPosition) => void;

  constructor(urlTemplate: string, options: L.TileLayerOptions, onTileUpdate: (tileKey: string, position: ChessPosition) => void) {
    super(urlTemplate, options);
    this.onTileUpdate = onTileUpdate;
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('canvas');
    tile.width = 256;
    tile.height = 256;
    
    // Generate chess position for this tile
    const position = generateChessPosition(coords);
    const tileKey = `${coords.z},${coords.x},${coords.y}`;
    
    // Store position data
    this.loadedTiles.set(tileKey, position);
    this.onTileUpdate(tileKey, position);
    
    // Draw tile
    this.drawTile(tile, position);
    
    done(null, tile);
    return tile;
  }

  private drawTile(canvas: HTMLCanvasElement, position: ChessPosition) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, 256, 256);
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 256, 256);
    
    // Border
    ctx.strokeStyle = '#4ecdc4';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 254, 254);
    
    // Mini chess board
    const boardSize = 120;
    const boardX = (256 - boardSize) / 2;
    const boardY = 40;
    const squareSize = boardSize / 8;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
        ctx.fillRect(boardX + col * squareSize, boardY + row * squareSize, squareSize, squareSize);
      }
    }
    
    // Statistics
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${position.metadata.games.toLocaleString()} games`, 128, 180);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#888';
    ctx.fillText(`ELO: ${position.metadata.avgElo}`, 128, 200);
    ctx.fillText(`Win: ${position.metadata.winRate}%`, 128, 220);
  }

  getTileData(tileKey: string): ChessPosition | undefined {
    return this.loadedTiles.get(tileKey);
  }

  redraw(): this {
    super.redraw();
    return this;
  }
}

interface ChessMapProps {
  className?: string;
}

const ChessMap: React.FC<ChessMapProps> = ({ className }) => {
  const [selectedPosition, setSelectedPosition] = useState<ChessPosition | null>(null);
  const [tileInfo, setTileInfo] = useState<{ coords: TileCoords; fen: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [tileCount, setTileCount] = useState(0);
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'processing' | 'generating'>('idle');
  const [showPositionPanel, setShowPositionPanel] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);
  const chessTileLayerRef = useRef<ChessTileLayer | null>(null);
  const tileDataRef = useRef<Map<string, ChessPosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    // Create the map
    const map = L.map(containerRef.current, {
      center: [0, 0],
      zoom: 0,
      minZoom: 0,
      maxZoom: 10,
      crs: L.CRS.Simple,
      maxBounds: [[-90, -180], [90, 180]],
      zoomControl: true,
      attributionControl: false
    });

    mapRef.current = map;

    // Create custom chess tile layer
    const chessTileLayer = new ChessTileLayer('', {
      attribution: 'Chess Universe',
      tileSize: 256,
      maxZoom: 10,
      minZoom: 0,
      noWrap: true
    }, (tileKey: string, position: ChessPosition) => {
      tileDataRef.current.set(tileKey, position);
      setTileCount(tileDataRef.current.size);
    });

    chessTileLayerRef.current = chessTileLayer;
    map.addLayer(chessTileLayer);

    // Event handlers
    map.on('click', (e: L.LeafletMouseEvent) => {
      const zoom = map.getZoom();
      const point = map.project(e.latlng, zoom);
      const tileX = Math.floor(point.x / 256);
      const tileY = Math.floor(point.y / 256);
      
      // Generate position for clicked tile
      const coords = { x: tileX, y: tileY, z: zoom };
      const position = generateChessPosition(coords);
      
      setSelectedPosition(position);
      setTileInfo({
        coords,
        fen: position.fen
      });
      setShowPositionPanel(true);
      
      // Store in tile data
      const tileKey = `${zoom},${tileX},${tileY}`;
      tileDataRef.current.set(tileKey, position);
      setTileCount(tileDataRef.current.size);
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    map.on('moveend', () => {
      setTileCount(tileDataRef.current.size);
    });

    // Set initial zoom level
    setZoomLevel(map.getZoom());

    return () => {
      map.remove();
    };
  }, []);

  const handleGenerateMoreTiles = () => {
    if (!mapRef.current) return;
    
    setWorkerStatus('generating');
    
    // Force refresh of visible tiles
    setTimeout(() => {
      if (chessTileLayerRef.current) {
        chessTileLayerRef.current.redraw();
      }
      setWorkerStatus('idle');
    }, 1000);
  };

  const handleShowStats = () => {
    const stats = {
      totalTiles: tileDataRef.current.size,
      currentZoom: zoomLevel,
      positions: Array.from(tileDataRef.current.values()).length
    };
    
    alert(`Statistics:\n\nTotal tiles: ${stats.totalTiles}\nCurrent zoom: ${stats.currentZoom}\nPositions loaded: ${stats.positions}`);
  };

  const handleExportPMTiles = () => {
    console.log('Exporting to PMTiles format...');
    alert('PMTiles export functionality would be implemented here!');
  };

  return (
    <div className={cn('relative h-screen w-screen', className)}>
      {/* Map Container */}
      <div 
        ref={containerRef}
        className="h-full w-full bg-background"
        style={{ height: '100vh', width: '100vw' }}
      />

      {/* Control Panel */}
      <ControlPanel
        onGenerateMoreTiles={handleGenerateMoreTiles}
        onShowStats={handleShowStats}
        onExportPMTiles={handleExportPMTiles}
        tileCount={tileCount}
        zoomLevel={zoomLevel}
        className="absolute top-4 left-4 w-64 z-[1000]"
      />

      {/* Position Panel */}
      {showPositionPanel && selectedPosition && (
        <>
          <PositionPanel
            data={selectedPosition}
            className="absolute top-4 right-4 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto z-[1000]"
          />
          <button
            onClick={() => setShowPositionPanel(false)}
            className="absolute top-4 right-4 z-[1001] w-8 h-8 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors"
          >
            <span className="text-lg">×</span>
          </button>
        </>
      )}

      {/* Status Panel */}
      <StatusPanel
        workerStatus={workerStatus}
        tileCount={tileCount}
        zoomLevel={zoomLevel}
        className="absolute bottom-4 left-4 w-64 z-[1000]"
      />

      {/* Tile Info */}
      {tileInfo && (
        <TileInfo
          coords={tileInfo.coords}
          fen={tileInfo.fen}
          className="absolute bottom-4 right-4 w-80 z-[1000]"
        />
      )}
    </div>
  );
};

export default ChessMap;