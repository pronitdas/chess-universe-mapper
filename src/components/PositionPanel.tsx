import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ChessBoard from './ChessBoard';
import { cn } from '@/lib/utils';
import { getRandomFamousPlayers, ChessComPlayer, getTitleDisplay } from '@/utils/chessComApi';

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
  onClose?: () => void;
  className?: string;
}

const PositionPanel: React.FC<PositionPanelProps> = ({ data, onClose, className }) => {
  const [players, setPlayers] = useState<ChessComPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    getRandomFamousPlayers(3).then(fetchedPlayers => {
      if (mounted) {
        setPlayers(fetchedPlayers);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [data.fen]);

  const fallbackPlayers = [
    { name: 'Magnus Carlsen', games: 42, rating: 2847, title: 'GM', avatar: undefined, isStreamer: false },
    { name: 'Hikaru Nakamura', games: 38, rating: 2789, title: 'GM', avatar: undefined, isStreamer: true },
    { name: 'Ian Nepomniachtchi', games: 31, rating: 2792, title: 'GM', avatar: undefined, isStreamer: false }
  ];

  const displayPlayers = players.length > 0 
    ? players.map(p => ({
        name: p.username,
        games: Math.floor(Math.random() * 50) + 10,
        rating: p.bestRating || p.followers || 2500,
        title: p.title,
        avatar: p.avatar,
        isStreamer: p.isStreamer
      }))
    : fallbackPlayers;

  return (
    <Card className={cn(
      'bg-glass backdrop-blur-xl border-border/30 shadow-lg',
      className
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold pr-8">
          Position: {data.moves.length > 0 ? data.moves.join(', ') : 'Starting Position'}
        </CardTitle>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-background/80 hover:bg-background border border-border rounded-full flex items-center justify-center transition-colors hover:bg-accent"
          >
            <span className="text-lg">×</span>
          </button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <ChessBoard fen={data.fen} size="md" />
        </div>

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

        <div className="space-y-3">
          <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Top Players {loading && '(Loading...)'}
          </h4>
          <div className="space-y-2">
            {displayPlayers.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  {player.avatar ? (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className="flex flex-col">
                    <span className="font-medium">{player.name}</span>
                    {player.title && (
                      <span className="text-xs text-primary">{getTitleDisplay(player.title)}</span>
                    )}
                  </div>
                  {player.isStreamer && (
                    <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                      LIVE
                    </Badge>
                  )}
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
