import React, { useState, useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { generateChessPosition, ChessPosition, TileCoords } from '@/utils/chessLogic';
import PositionPanel from './PositionPanel';
import ControlPanel from './ControlPanel';
import StatusPanel from './StatusPanel';
import TileInfo from './TileInfo';
import { cn } from '@/lib/utils';

const CHESS_TILE_SOURCE = 'chess-tiles';

interface ChessMapProps {
  className?: string;
}

// Generate a canvas data URL for a chess tile
function generateTileCanvas(position: ChessPosition): string {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#4ecdc4';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 254, 254);

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

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${position.metadata.games.toLocaleString()} games`, 128, 180);

  ctx.font = '14px Arial';
  ctx.fillStyle = '#888';
  ctx.fillText(`ELO: ${position.metadata.avgElo}`, 128, 200);
  ctx.fillText(`Win: ${position.metadata.winRate}%`, 128, 220);

  return canvas.toDataURL();
}

const ChessMap: React.FC<ChessMapProps> = ({ className }) => {
  const [selectedPosition, setSelectedPosition] = useState<ChessPosition | null>(null);
  const [tileInfo, setTileInfo] = useState<{ coords: TileCoords; fen: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [tileCount, setTileCount] = useState(0);
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'processing' | 'generating'>('idle');
  const [showPositionPanel, setShowPositionPanel] = useState(false);

  const mapRef = useRef<maplibregl.Map | null>(null);
  const tileDataRef = useRef<Map<string, ChessPosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        name: 'Chess Map Style',
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#0a0a0a'
            }
          }
        ],
        glyphs: 'https://demotiles.mapbox.com/font/{fontstack}/{range}.pbf'
      },
      center: [0, 0],
      zoom: 0,
      minZoom: 0,
      maxZoom: 10,
      attributionControl: false
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource(CHESS_TILE_SOURCE, {
        type: 'raster',
        tiles: [],
        tileSize: 256
      });

      map.addLayer({
        id: 'chess-tiles-layer',
        type: 'raster',
        source: CHESS_TILE_SOURCE,
        paint: {
          'raster-opacity': 1,
          'raster-brightness-max': 1,
          'raster-brightness-min': 0.1
        }
      });
    });

    map.on('click', (e) => {
      const zoom = map.getZoom();
      const point = e.point;
      const tileX = Math.floor(point.x / 256);
      const tileY = Math.floor(point.y / 256);
      const coords = { x: tileX, y: tileY, z: Math.floor(zoom) };
      const position = generateChessPosition(coords);

      setSelectedPosition(position);
      setTileInfo({ coords, fen: position.fen });
      setShowPositionPanel(true);

      const tileKey = `${coords.z},${coords.x},${coords.y}`;
      tileDataRef.current.set(tileKey, position);
      setTileCount(tileDataRef.current.size);
    });

    map.on('zoomend', () => setZoomLevel(map.getZoom()));
    map.on('moveend', () => setTileCount(tileDataRef.current.size));
    setZoomLevel(map.getZoom());

    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    const map = mapRef.current;
    const zoom = Math.floor(map.getZoom());
    const bounds = map.getBounds();
    const size = map.getCanvas().getBoundingClientRect();

    const tileSize = 256;
    const nw = map.project(bounds.getNorthWest(), zoom);
    const se = map.project(bounds.getSouthEast(), zoom);

    const startX = Math.floor(nw.x / tileSize);
    const endX = Math.floor(se.x / tileSize);
    const startY = Math.floor(nw.y / tileSize);
    const endY = Math.floor(se.y / tileSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const coords = { x, y, z: zoom };
        const tileKey = `${coords.z},${coords.x},${coords.y}`;

        if (!tileDataRef.current.has(tileKey)) {
          const position = generateChessPosition(coords);
          tileDataRef.current.set(tileKey, position);
          tileDataRef.current.set(`canvas-${tileKey}`, position);
        }
      }
    }

    setTileCount(tileDataRef.current.size);
  }, [zoomLevel]);

  const handleGenerateMoreTiles = () => {
    setWorkerStatus('generating');
    setTimeout(() => setWorkerStatus('idle'), 1000);
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
      <div
        ref={containerRef}
        className="h-full w-full bg-background"
        style={{ height: '100vh', width: '100vw' }}
      />

      <ControlPanel
        onGenerateMoreTiles={handleGenerateMoreTiles}
        onShowStats={handleShowStats}
        onExportPMTiles={handleExportPMTiles}
        tileCount={tileCount}
        zoomLevel={zoomLevel}
        className="absolute top-4 left-4 w-64 z-[1000]"
      />

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

      <StatusPanel
        workerStatus={workerStatus}
        tileCount={tileCount}
        zoomLevel={zoomLevel}
        className="absolute bottom-4 left-4 w-64 z-[1000]"
      />

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
