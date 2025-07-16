import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChessBoard from './ChessBoard';
import { cn } from '@/lib/utils';

interface PositionData {
  fen: string;
  moves: string[];
  metadata: {
    games: number;
    avgElo: number;
    winRate: number;
  };
}

interface PositionPanelProps {
  data: PositionData;
  className?: string;
}

const PositionPanel: React.FC<PositionPanelProps> = ({ data, className }) => {
  const topPlayers = [
    { name: 'Magnus Carlsen', games: 42, rating: 2847 },
    { name: 'Hikaru Nakamura', games: 38, rating: 2789 },
    { name: 'Ian Nepomniachtchi', games: 31, rating: 2792 }
  ];

  return (
    <Card className={cn(
      'backdrop-blur-xl bg-glass-bg border-glass-border shadow-lg',
      className
    )}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Position: {data.moves.length > 0 ? data.moves.join(', ') : 'Starting Position'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Chess Board */}
        <div className="flex justify-center">
          <ChessBoard fen={data.fen} size="md" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/20">
            <div className="text-2xl font-bold text-primary">
              {data.metadata.games.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Games</div>
          </div>
          
          <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/20">
            <div className="text-2xl font-bold text-primary">
              {data.metadata.avgElo}
            </div>
            <div className="text-sm text-muted-foreground">Avg ELO</div>
          </div>
          
          <div className="text-center p-3 bg-secondary/20 rounded-lg border border-border/20">
            <div className="text-2xl font-bold text-primary">
              {data.metadata.winRate}%
            </div>
            <div className="text-sm text-muted-foreground">White Win%</div>
          </div>
        </div>

        {/* Top Players */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Top Players
          </h4>
          <div className="space-y-2">
            {topPlayers.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{player.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{player.games} games</span>
                  <span>•</span>
                  <span>{player.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionPanel;