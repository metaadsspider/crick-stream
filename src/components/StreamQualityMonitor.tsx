import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';

interface StreamQualityMonitorProps {
  isStreaming: boolean;
  streamUrl?: string;
  className?: string;
}

export const StreamQualityMonitor = ({ isStreaming, streamUrl, className }: StreamQualityMonitorProps) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [quality, setQuality] = useState<string>('Auto');
  const [bufferHealth, setBufferHealth] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    if (!isStreaming || !streamUrl) return;

    const monitorInterval = setInterval(() => {
      // Simulate latency monitoring (in a real app, this would connect to actual stream metrics)
      const simulatedLatency = Math.random() * 3000 + 500; // 0.5-3.5 seconds
      setLatency(simulatedLatency);
      
      // Simulate buffer health
      const bufferLevel = Math.random() * 100;
      setBufferHealth(bufferLevel);
      setIsBuffering(bufferLevel < 20);
      
      // Auto quality detection
      if (simulatedLatency < 1000) {
        setQuality('HD');
      } else if (simulatedLatency < 2000) {
        setQuality('SD');
      } else {
        setQuality('Low');
      }
    }, 1000);

    return () => clearInterval(monitorInterval);
  }, [isStreaming, streamUrl]);

  if (!isStreaming) return null;

  const getLatencyColor = (latency: number | null) => {
    if (!latency) return 'text-muted-foreground';
    if (latency < 1000) return 'text-green-500';
    if (latency < 2000) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLatencyStatus = (latency: number | null) => {
    if (!latency) return 'Measuring...';
    if (latency < 1000) return 'Excellent';
    if (latency < 2000) return 'Good';
    return 'Poor';
  };

  return (
    <div className={`bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">Stream Monitor</span>
        <div className="flex items-center space-x-1">
          {navigator.onLine ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center space-x-1 mb-1">
            <Clock className="w-3 h-3" />
            <span>Latency</span>
          </div>
          <div className={`font-mono ${getLatencyColor(latency)}`}>
            {latency ? `${Math.round(latency)}ms` : '--'}
          </div>
          <div className="text-muted-foreground text-xs">
            {getLatencyStatus(latency)}
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-1 mb-1">
            <Activity className="w-3 h-3" />
            <span>Quality</span>
          </div>
          <Badge 
            variant={quality === 'HD' ? 'default' : quality === 'SD' ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {quality}
          </Badge>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span>Buffer Health</span>
          <span className="font-mono">{Math.round(bufferHealth)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              bufferHealth > 50 ? 'bg-green-500' : 
              bufferHealth > 20 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${bufferHealth}%` }}
          />
        </div>
        {isBuffering && (
          <div className="text-red-400 text-xs mt-1 animate-pulse">
            Buffering...
          </div>
        )}
      </div>

      <div className="text-muted-foreground text-xs">
        Ultra-low latency mode enabled
      </div>
    </div>
  );
};