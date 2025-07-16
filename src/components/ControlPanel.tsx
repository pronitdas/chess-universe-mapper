import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  onGenerateMoreTiles: () => void;
  onShowStats: () => void;
  onExportPMTiles: () => void;
  tileCount: number;
  zoomLevel: number;
  className?: string;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  onGenerateMoreTiles,
  onShowStats,
  onExportPMTiles,
  tileCount,
  zoomLevel,
  className
}) => {
  return (
    <Card className={cn(
      'backdrop-blur-xl bg-glass-bg border-glass-border shadow-lg',
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
        {/* Control Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={onGenerateMoreTiles}
            className="w-full"
            variant="default"
          >
            Generate More Tiles
          </Button>
          
          <Button 
            onClick={onShowStats}
            className="w-full"
            variant="secondary"
          >
            Show Statistics
          </Button>
          
          <Button 
            onClick={onExportPMTiles}
            className="w-full"
            variant="outline"
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
      </CardContent>
    </Card>
  );
};

export default ControlPanel;