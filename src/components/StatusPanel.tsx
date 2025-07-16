import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatusPanelProps {
  workerStatus: 'idle' | 'processing' | 'generating';
  tileCount: number;
  zoomLevel: number;
  className?: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ 
  workerStatus, 
  tileCount, 
  zoomLevel, 
  className 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-500';
      case 'generating':
        return 'bg-blue-500';
      default:
        return 'bg-status-active';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processing':
        return 'Processing tiles...';
      case 'generating':
        return 'Generating positions...';
      default:
        return 'Workers idle';
    }
  };

  return (
    <Card className={cn(
      'backdrop-blur-xl bg-glass-bg border-glass-border shadow-lg',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            'w-3 h-3 rounded-full animate-pulse-chess',
            getStatusColor(workerStatus)
          )} />
          <span className="text-sm font-medium">
            {getStatusText(workerStatus)}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Zoom Level:</span>
            <span className="font-mono">{zoomLevel}</span>
          </div>
          <div className="flex justify-between">
            <span>Tiles Loaded:</span>
            <span className="font-mono">{tileCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusPanel;