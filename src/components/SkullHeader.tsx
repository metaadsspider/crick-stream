import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  MessageCircle, 
  Wifi, 
  WifiOff,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkullHeaderProps {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  lastUpdated: Date;
  isLoading: boolean;
  onRefresh: () => void;
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
  className?: string;
}

export const SkullHeader = ({
  totalMatches,
  liveMatches,
  upcomingMatches,
  lastUpdated,
  isLoading,
  onRefresh,
  onSearch,
  onFilterChange,
  currentFilter,
  className
}: SkullHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeSinceUpdate = () => {
    const diffMs = currentTime.getTime() - lastUpdated.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 1) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  const filters = [
    { id: 'all', label: 'All', count: totalMatches },
    { id: 'live', label: 'Live', count: liveMatches },
    { id: 'upcoming', label: 'Upcoming', count: upcomingMatches },
    { id: 'streamable', label: 'Streamable', count: liveMatches }
  ];

  return (
    <div className={cn("bg-gradient-dark rounded-xl shadow-card-skull border border-border/50", className)}>
      {/* Top Banner */}
      <div className="bg-gradient-skull p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl animate-float">💀</div>
            <div>
              <h1 className="text-2xl font-bold text-skull-dark">Skull Crick News</h1>
              <p className="text-skull-dark/80 text-sm">Live Cricket Streams & Updates</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-skull-dark font-bold text-lg">{formatTime(currentTime)}</div>
            <div className="text-skull-dark/80 text-sm">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-4 border-b border-border/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalMatches}</div>
            <div className="text-xs text-muted-foreground">Total Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{liveMatches}</div>
            <div className="text-xs text-muted-foreground">Live Now</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{upcomingMatches}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </div>
          <div className="text-center flex items-center justify-center space-x-1">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="p-4 space-y-4">
        {/* Search and Refresh */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search matches, teams, tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50 focus:border-primary"
              />
            </div>
          </form>
          
          <div className="flex space-x-2">
            <Button
              onClick={onRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="hover:bg-primary/10"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
            
            <Button
              onClick={() => window.open('https://t.me/skullcricknews', '_blank')}
              variant="outline"
              size="sm"
              className="hover:bg-accent/10"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              variant={currentFilter === filter.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "relative transition-all duration-200",
                currentFilter === filter.id 
                  ? "bg-gradient-skull text-skull-dark shadow-skull" 
                  : "hover:bg-muted/50"
              )}
            >
              <Filter className="w-3 h-3 mr-1" />
              {filter.label}
              <Badge 
                variant="secondary" 
                className="ml-2 text-xs"
              >
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Last updated: {getTimeSinceUpdate()}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Auto-refresh enabled</span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-destructive/10 border-t border-destructive/20 p-3 rounded-b-xl">
        <p className="text-xs text-destructive text-center font-medium">
          ⚠️ DISCLAIMER: WE DO NOT HOST OR OWN ANY STREAMS. ALL CONTENT IS PUBLICLY AVAILABLE.
        </p>
      </div>
    </div>
  );
};