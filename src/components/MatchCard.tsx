import React from 'react';
import { CricketMatch } from '@/types/cricket';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';

interface MatchCardProps {
  match: CricketMatch;
  onWatch: (match: CricketMatch) => void;
  className?: string;
}

export const MatchCard = ({ match, onWatch, className = '' }: MatchCardProps) => {
  const getStatusBadge = () => {
    if (match.status === 'live') {
      return (
        <Badge className="absolute top-4 right-4 bg-red-500 text-white animate-pulse border-0">
          🔴 LIVE
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-0 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 ${className}`}>
      {/* Background Image */}
      <div 
        className="relative h-64 bg-cover bg-center bg-gradient-to-br from-primary/20 to-accent/20"
        style={{
          backgroundImage: match.image ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${match.image})` : `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)`
        }}
      >
        {/* Status Badge */}
        {getStatusBadge()}
        
        {/* Tournament Category */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-black/50 text-white border-0 text-xs backdrop-blur-sm">
            Cricket
          </Badge>
        </div>
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
        {/* Match Title */}
        <h3 className="font-bold text-white text-lg mb-6 leading-tight line-clamp-2">
          {match.title}
        </h3>
        
        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => onWatch(match)}
            className="bg-primary hover:bg-primary/90 text-black border-2 border-primary rounded-full font-semibold transition-all duration-300 shadow-lg px-8"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Watch
          </Button>
        </div>
      </div>
    </Card>
  );
};