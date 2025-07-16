import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TileInfoProps {
  coords: { x: number; y: number; z: number };
  fen: string;
  className?: string;
}

const TileInfo: React.FC<TileInfoProps> = ({ coords, fen, className }) => {
  return (
    <Card className={cn(
      'backdrop-blur-xl bg-glass-bg border-glass-border shadow-lg',
      className
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            TILE
          </Badge>
          <span className="text-sm font-mono text-primary">
            Z:{coords.z} X:{coords.x} Y:{coords.y}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            FEN Position
          </div>
          <div className="text-xs font-mono bg-secondary/20 p-2 rounded border border-border/20 break-all">
            {fen}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TileInfo;