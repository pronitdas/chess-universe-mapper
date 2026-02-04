import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateChessPosition, ChessPosition, TileCoords, generateTileDataURL } from '@/utils/chessLogic';
import PositionPanel from './PositionPanel';
import ControlPanel from './ControlPanel';
import StatusPanel from './StatusPanel';
import TileInfo from './TileInfo';
import { cn } from '@/lib/utils';

interface ChessMapProps {
  className?: string;
}

const TILE_SIZE = 256;
const MAX_ZOOM = 10;

const ChessMap: React.FC<ChessMapProps> = ({ className }) => {
  const [selectedPosition, setSelectedPosition] = useState<ChessPosition | null>(null);
  const [tileInfo, setTileInfo] = useState<{ coords: TileCoords; fen: string } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [tileCount, setTileCount] = useState(0);
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'processing' | 'generating'>('idle');
  const [showPositionPanel, setShowPositionPanel] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tileDataRef = useRef<Map<string, ChessPosition>>(new Map());
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const getTileKey = (x: number, y: number, z: number) => `${z},${x},${y}`;

  const getTileImage = useCallback((x: number, y: number, z: number): HTMLImageElement | null => {
    const key = getTileKey(x, y, z);
    if (imageCacheRef.current.has(key)) {
      const img = imageCacheRef.current.get(key)!;
      if (img.complete) return img;
      return null;
    }

    const img = new Image();
    img.src = generateTileDataURL({ x, y, z });
    img.onload = () => {
      if (!isDraggingRef.current) {
        requestAnimationFrame(() => drawTiles());
      }
    };
    imageCacheRef.current.set(key, img);
    return null;
  }, []);

  const drawTiles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;

    const startX = Math.floor((centerX - width / 2) / TILE_SIZE);
    const endX = Math.ceil((centerX + width / 2) / TILE_SIZE);
    const startY = Math.floor((centerY - height / 2) / TILE_SIZE);
    const endY = Math.ceil((centerY + height / 2) / TILE_SIZE);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const tileX = x * TILE_SIZE - centerX + width / 2;
        const tileY = y * TILE_SIZE - centerY + height / 2;

        const img = getTileImage(x, y, zoomLevel);

        if (img) {
          ctx.drawImage(img, tileX, tileY, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = '#2a2a4e';
          ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#3a3a6e';
          ctx.lineWidth = 1;
          ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
        }

        if (!tileDataRef.current.has(getTileKey(x, y, zoomLevel))) {
          const position = generateChessPosition({ x, y, z: zoomLevel });
          tileDataRef.current.set(getTileKey(x, y, zoomLevel), position);
        }
      }
    }

    setTileCount(tileDataRef.current.size);
  }, [offset, zoomLevel, getTileImage]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => drawTiles());

    return () => cancelAnimationFrame(rafRef.current);
  }, [drawTiles]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0, Math.min(MAX_ZOOM, zoomLevel + delta));
    if (newZoom !== zoomLevel) {
      setZoomLevel(newZoom);
      imageCacheRef.current.clear();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;

    const tileX = Math.floor((clickX - (width / 2 - centerX)) / TILE_SIZE);
    const tileY = Math.floor((clickY - (height / 2 - centerY)) / TILE_SIZE);

    const coords = { x: tileX, y: tileY, z: zoomLevel };
    const position = generateChessPosition(coords);

    setSelectedPosition(position);
    setTileInfo({ coords, fen: position.fen });
    setShowPositionPanel(true);

    tileDataRef.current.set(getTileKey(tileX, tileY, zoomLevel), position);
  };

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
    alert('PMTiles export functionality would be implemented here!');
  };

  const handleZoomIn = () => {
    if (zoomLevel < MAX_ZOOM) {
      setZoomLevel(zoomLevel + 1);
      imageCacheRef.current.clear();
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0) {
      setZoomLevel(zoomLevel - 1);
      imageCacheRef.current.clear();
    }
  };

  const handleResetView = () => {
    setZoomLevel(0);
    setOffset({ x: 0, y: 0 });
    imageCacheRef.current.clear();
  };

  return (
    <div className={cn('relative h-screen w-screen overflow-hidden bg-[#1a1a2e]', className)}>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{ width: '100%', height: '100%' }}
      />

      <ControlPanel
        onGenerateMoreTiles={handleGenerateMoreTiles}
        onShowStats={handleShowStats}
        onExportPMTiles={handleExportPMTiles}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        tileCount={tileCount}
        zoomLevel={zoomLevel}
        className="absolute top-4 left-4 w-72 z-50"
      />

      {showPositionPanel && selectedPosition && (
        <PositionPanel
          data={selectedPosition}
          onClose={() => setShowPositionPanel(false)}
          className="absolute top-4 right-4 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto z-50"
        />
      )}

      <StatusPanel
        workerStatus={workerStatus}
        tileCount={tileCount}
        zoomLevel={zoomLevel}
        className="absolute bottom-4 left-4 w-64 z-50"
      />

      {tileInfo && (
        <TileInfo
          coords={tileInfo.coords}
          fen={tileInfo.fen}
          className="absolute bottom-4 right-4 w-80 z-50"
        />
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel === 0}
          className="w-10 h-10 bg-glass hover:bg-background border border-border rounded-full flex items-center justify-center text-lg font-bold disabled:opacity-50 transition-all shadow-lg"
        >
          −
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel === MAX_ZOOM}
          className="w-10 h-10 bg-glass hover:bg-background border border-border rounded-full flex items-center justify-center text-lg font-bold disabled:opacity-50 transition-all shadow-lg"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default ChessMap;
