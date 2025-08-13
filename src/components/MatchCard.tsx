import { CricketMatch } from '@/types/cricket';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Tv, Calendar, Globe, MapPin } from 'lucide-react';
import { useState } from 'react';

interface MatchCardProps {
  match: CricketMatch;
  onWatch: (match: CricketMatch) => void;
  className?: string;
}

export const MatchCard = ({ match, onWatch, className = '' }: MatchCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('indian');

  const getTournamentLogo = (tournament: string) => {
    const tournamentLogos: { [key: string]: string } = {
      'ipl': 'https://logos.textgiraffe.com/logos/logo-name/Ipl-designstyle-kiddo-m.png',
      't20': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/ICC_T20_World_Cup_logo.svg/200px-ICC_T20_World_Cup_logo.svg.png',
      'bbl': 'https://logos.textgiraffe.com/logos/logo-name/Bbl-designstyle-jungle-m.png',
      'psl': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6b/Pakistan_Super_League_logo.svg/200px-Pakistan_Super_League_logo.svg.png',
      'cpl': 'https://logos.textgiraffe.com/logos/logo-name/Cpl-designstyle-jungle-m.png',
      'hundred': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/60/The_Hundred_logo.svg/200px-The_Hundred_logo.svg.png',
      'wpl': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Women%27s_Premier_League_logo.svg/200px-Women%27s_Premier_League_logo.svg.png',
      'maharaja': 'https://via.placeholder.com/60x60/ff6b35/white?text=M20',
      'andhra': 'https://via.placeholder.com/60x60/0066cc/white?text=APL',
      'ecs': 'https://via.placeholder.com/60x60/00cc66/white?text=ECS',
      'default': 'https://via.placeholder.com/60x60/ff6b35/white?text=🏏'
    };

    const key = tournament.toLowerCase();
    for (const [tournamentKey, logo] of Object.entries(tournamentLogos)) {
      if (key.includes(tournamentKey)) {
        return logo;
      }
    }
    return tournamentLogos.default;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'live':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse';
      case 'upcoming':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'completed':
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />;
      case 'upcoming':
        return <Calendar className="w-4 h-4" />;
      case 'completed':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Time TBA';
    }
  };

  const formatMatchId = (id: string): string => {
    return id.replace('original_', '').replace('fancode_', '');
  };

  return (
    <Card className={`group relative overflow-hidden border-border/50 bg-gradient-to-br from-card/95 to-muted/30 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-105 hover:border-primary/30 ${className}`}>
      {/* Tournament Header with Logo */}
      <div className="relative h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
              <img 
                src={getTournamentLogo(match.tournament)} 
                alt={match.tournament}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/32x32/ff6b35/white?text=🏏';
                }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                {match.tournament}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${getStatusColor(match.status)} text-xs px-2 py-1`}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(match.status)}
                    <span className="uppercase font-bold">{match.status}</span>
                  </div>
                </Badge>
              </div>
            </div>
          </div>
          {match.quality && (
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              {match.quality}
            </Badge>
          )}
        </div>
      </div>

      {/* Match Content */}
      <div className="p-6 space-y-4">
        {/* Teams Section */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight">
            {match.title}
          </h3>
          
          <div className="flex items-center justify-between space-x-4">
            {/* Team 1 */}
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/20">
                  <img 
                    src={match.team1.logo || match.team1.flag} 
                    alt={match.team1.name}
                    className="w-10 h-10 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = match.team1.flag;
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {match.team1.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {match.team1.shortName}
                </p>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex-shrink-0 px-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <span className="text-xs font-bold text-white">VS</span>
              </div>
            </div>

            {/* Team 2 */}
            <div className="flex items-center space-x-3 flex-1 flex-row-reverse">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/20">
                  <img 
                    src={match.team2.logo || match.team2.flag} 
                    alt={match.team2.name}
                    className="w-10 h-10 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = match.team2.flag;
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="font-semibold text-sm text-foreground truncate">
                  {match.team2.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {match.team2.shortName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="space-y-3 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Start Time:</span>
            </div>
            <span className="font-semibold text-foreground">
              {formatTime(match.startTime)}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Match ID:</span>
            </div>
            <span className="font-mono text-primary font-semibold">
              {formatMatchId(match.id)}
            </span>
          </div>
        </div>

        {/* Language Selection */}
        <div className="flex space-x-2">
          <Button
            variant={selectedLanguage === 'indian' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs h-8 bg-gradient-to-r from-orange-500 to-green-500 text-white hover:from-orange-600 hover:to-green-600"
            onClick={() => setSelectedLanguage('indian')}
          >
            <span className="mr-1">🇮🇳</span>
            Indian
          </Button>
          <Button
            variant={selectedLanguage === 'worldwide' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={() => setSelectedLanguage('worldwide')}
          >
            <Globe className="w-3 h-3 mr-1" />
            Worldwide
          </Button>
        </div>

        {/* Watch Button */}
        {match.isStreamable && (
          <Button
            onClick={() => onWatch(match)}
            className="w-full bg-gradient-skull hover:shadow-skull group-hover:scale-105 transition-all duration-300"
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            <Tv className="w-4 h-4 mr-2" />
            Watch Live Stream
          </Button>
        )}

        {!match.isStreamable && (
          <Button
            variant="outline"
            disabled
            className="w-full"
            size="lg"
          >
            <Clock className="w-4 h-4 mr-2" />
            Stream Not Available
          </Button>
        )}
      </div>
    </Card>
  );
};