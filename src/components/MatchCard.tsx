import { CricketMatch } from '@/types/cricket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Calendar, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: CricketMatch;
  onWatch: (match: CricketMatch) => void;
  className?: string;
}

export const MatchCard = ({ match, onWatch, className }: MatchCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white animate-live-pulse';
      case 'upcoming':
        return 'bg-amber-500 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Tv className="w-3 h-3" />;
      case 'upcoming':
        return <Clock className="w-3 h-3" />;
      case 'completed':
        return <Calendar className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLive = match.status === 'live';
  const canWatch = match.isStreamable && (isLive || match.streamUrl);

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card-skull hover:scale-[1.02]",
        isLive && "ring-2 ring-red-500/50 shadow-glow",
        className
      )}
    >
      {/* Background Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={match.image}
          alt={match.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = '/api/placeholder/400/200';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={cn("text-xs font-bold", getStatusColor(match.status))}>
            {getStatusIcon(match.status)}
            <span className="ml-1">{match.status.toUpperCase()}</span>
          </Badge>
        </div>

        {/* Language Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="text-xs">
            {match.language}
          </Badge>
        </div>

        {/* Watch Button Overlay */}
        {canWatch && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={() => onWatch(match)}
              size="lg"
              className="bg-skull-orange hover:bg-skull-orange/90 text-skull-dark font-bold shadow-skull"
            >
              <Play className="w-5 h-5 mr-2" />
              {isLive ? 'Watch Live' : 'Watch'}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tournament */}
        <div className="text-xs text-primary font-medium mb-2 uppercase tracking-wider">
          {match.tournament}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <img
                src={match.team1.flag}
                alt={match.team1.name}
                className="w-8 h-8 rounded-full border-2 border-border"
                onError={(e) => {
                  e.currentTarget.src = '/api/placeholder/32/32';
                }}
              />
              <div>
                <div className="font-semibold text-sm">{match.team1.shortName}</div>
                <div className="text-xs text-muted-foreground truncate max-w-20">
                  {match.team1.name}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center px-4">
            <div className="text-2xl font-bold text-primary animate-float">vs</div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="font-semibold text-sm">{match.team2.shortName}</div>
              <div className="text-xs text-muted-foreground truncate max-w-20">
                {match.team2.name}
              </div>
            </div>
            <img
              src={match.team2.flag}
              alt={match.team2.name}
              className="w-8 h-8 rounded-full border-2 border-border"
              onError={(e) => {
                e.currentTarget.src = '/api/placeholder/32/32';
              }}
            />
          </div>
        </div>

        {/* Match Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Start Time:</span>
            <span className="font-medium">{formatTime(match.startTime)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Match ID:</span>
            <span className="font-mono text-xs">{match.id}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {canWatch ? (
            <Button
              onClick={() => onWatch(match)}
              className="w-full bg-gradient-skull hover:shadow-skull transition-all duration-300"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              {isLive ? 'Watch Live' : 'Watch Stream'}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled
              className="w-full"
              size="sm"
            >
              Stream Not Available
            </Button>
          )}
        </div>
      </div>

      {/* Live Indicator */}
      {isLive && (
        <div className="absolute -top-1 -right-1 w-4 h-4">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
          <div className="absolute inset-0 bg-red-600 rounded-full"></div>
        </div>
      )}
    </Card>
  );
};