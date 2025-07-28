import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { CricketMatch } from '@/types/cricket';
import { cricketApi } from '@/services/cricketApi';
import { X, ExternalLink, Share2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreamModalProps {
  match: CricketMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StreamModal = ({ match, isOpen, onClose }: StreamModalProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (match && isOpen) {
      fetchStreamUrl();
    }
  }, [match, isOpen]);

  const fetchStreamUrl = async () => {
    if (!match) return;

    setIsLoading(true);
    setError(null);

    try {
      // First try the match's existing stream URL
      if (match.streamUrl) {
        setStreamUrl(match.streamUrl);
        setIsLoading(false);
        return;
      }

      // Try to fetch from our API service
      const url = await cricketApi.getStreamUrl(match.id);
      
      if (url) {
        setStreamUrl(url);
        toast({
          title: "Stream Ready",
          description: "Successfully loaded the stream",
        });
      } else {
        setError('Stream not available for this match');
        toast({
          title: "Stream Unavailable",
          description: "No stream found for this match",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Failed to load stream');
      toast({
        title: "Error",
        description: "Failed to load the stream",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!match) return;

    try {
      await navigator.share({
        title: match.title,
        text: `Watch ${match.title} live on Skull Crick News`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Match link copied to clipboard",
      });
    }
  };

  const openInNewTab = () => {
    if (streamUrl) {
      window.open(streamUrl, '_blank');
    }
  };

  if (!match) return null;

  const isLive = match.status === 'live';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-gradient-dark border-border/50">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {match.title}
              </DialogTitle>
              {isLive && (
                <Badge className="bg-red-500 text-white animate-live-pulse">
                  🔴 LIVE
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="hover:bg-muted/50"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              {streamUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInNewTab}
                  className="hover:bg-muted/50"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Video Player */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="aspect-video bg-gradient-dark rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mb-4 mx-auto"></div>
                    <p className="text-muted-foreground">Loading stream...</p>
                  </div>
                </div>
              ) : streamUrl ? (
                <VideoPlayer
                  src={streamUrl}
                  title={match.title}
                  poster={match.image}
                  className="h-full"
                />
              ) : (
                <div className="aspect-video bg-gradient-dark rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💀</div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Stream Unavailable</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {error || 'No stream available for this match'}
                    </p>
                    <Button 
                      onClick={fetchStreamUrl}
                      variant="outline"
                      className="hover:bg-primary/10"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Match Info Sidebar */}
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/30">
              <div className="space-y-6">
                {/* Teams */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">TEAMS</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={match.team1.flag}
                        alt={match.team1.name}
                        className="w-10 h-10 rounded-full border-2 border-border"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/40/40';
                        }}
                      />
                      <div>
                        <div className="font-medium">{match.team1.name}</div>
                        <div className="text-sm text-muted-foreground">{match.team1.shortName}</div>
                      </div>
                    </div>
                    
                    <div className="text-center py-2">
                      <span className="text-2xl font-bold text-primary">VS</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <img
                        src={match.team2.flag}
                        alt={match.team2.name}
                        className="w-10 h-10 rounded-full border-2 border-border"
                        onError={(e) => {
                          e.currentTarget.src = '/api/placeholder/40/40';
                        }}
                      />
                      <div>
                        <div className="font-medium">{match.team2.name}</div>
                        <div className="text-sm text-muted-foreground">{match.team2.shortName}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Details */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">MATCH INFO</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tournament:</span>
                      <span className="font-medium">{match.tournament}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={
                        match.status === 'live' ? 'bg-red-500' :
                        match.status === 'upcoming' ? 'bg-amber-500' : 'bg-green-500'
                      }>
                        {match.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Language:</span>
                      <span className="font-medium">{match.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Match ID:</span>
                      <span className="font-mono text-xs">{match.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Time:</span>
                      <span className="font-medium text-xs">
                        {new Date(match.startTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CORS Notice */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <h4 className="font-semibold text-amber-500 text-sm mb-2">CORS Notice</h4>
                  <p className="text-xs text-amber-500/80 mb-2">
                    If the stream doesn't load, install a CORS browser extension:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => window.open('https://chrome.google.com/webstore/search/cors', '_blank')}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Get CORS Extension
                  </Button>
                </div>

                {/* Telegram Link */}
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                  <h4 className="font-semibold text-accent text-sm mb-2">Join Our Community</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs hover:bg-accent/10"
                    onClick={() => window.open('https://t.me/skullcricknews', '_blank')}
                  >
                    📱 Join Telegram
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};