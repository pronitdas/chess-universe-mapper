import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  onGenerateMoreTiles: () => void;
  onShowStats: () => void;
  onExportPMTiles: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  tileCount: number;
  zoomLevel: number;
  className?: string;
}

const ZOOM_LABELS: { [key: number]: string } = {
  0: 'Opening',
  1: 'Early Game',
  2: 'Middlegame',
  3: 'Complexity',
  4: 'Advanced',
  5: 'Expert',
  6: 'Master',
  7: 'Grandmaster',
  8: 'Elite',
  9: 'Legendary',
  10: 'Perfect'
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  onGenerateMoreTiles,
  onShowStats,
  onExportPMTiles,
  onZoomIn,
  onZoomOut,
  onResetView,
  tileCount,
  zoomLevel,
  className
}) => {
  const canZoomIn = zoomLevel < 10;
  const canZoomOut = zoomLevel > 0;

  return (
    <Card className={cn(
      'bg-glass backdrop-blur-xl border-border/30 shadow-lg',
      className
    )}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          Chess Universe
          <Badge variant="secondary" className="animate-pulse-chess">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Zoom Controls */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Navigation</div>
          <div className="flex gap-2">
            <Button
              onClick={onZoomOut}
              disabled={!canZoomOut}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              − Zoom Out
            </Button>
            <Button
              onClick={onZoomIn}
              disabled={!canZoomIn}
              variant="default"
              size="sm"
              className="flex-1"
            >
              + Zoom In
            </Button>
          </div>
          <Button
            onClick={onResetView}
            variant="ghost"
            size="sm"
            className="w-full text-xs"
          >
            Reset to Starting Position
          </Button>
        </div>

        {/* Zoom Level Display */}
        <div className="p-3 bg-secondary/20 rounded-lg border border-border/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Level {zoomLevel}</span>
            <span className="text-sm font-medium text-primary">{ZOOM_LABELS[zoomLevel] || 'Unknown'}</span>
          </div>
          <div className="w-full bg-secondary/30 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(zoomLevel / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={onGenerateMoreTiles}
            className="w-full"
            variant="default"
            size="sm"
          >
            Generate More Tiles
          </Button>
          
          <Button 
            onClick={onShowStats}
            className="w-full"
            variant="secondary"
            size="sm"
          >
            Show Statistics
          </Button>
          
          <Button 
            onClick={onExportPMTiles}
            className="w-full"
            variant="outline"
            size="sm"
          >
            Export PMTiles
          </Button>
        </div>

        {/* Info Display */}
        <div className="pt-4 border-t border-border/20">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Zoom Level</div>
              <div className="font-mono text-primary font-semibold">{zoomLevel}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Tiles Loaded</div>
              <div className="font-mono text-primary font-semibold">{tileCount}</div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/10">
          <div className="font-medium">Keyboard Shortcuts:</div>
          <div>Scroll: Zoom in/out</div>
          <div>Click tile: View details</div>
          <div>Drag: Pan around</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;