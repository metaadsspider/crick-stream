import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from './VideoPlayer';
import { CricketMatch } from '@/types/cricket';
import { cricketApi } from '@/services/cricketApi';
import { X } from 'lucide-react';
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
      console.log('🔍 Fetching stream URL for match:', match.id);
      
      // Priority order: adfree_url > dai_url > streamUrl > API
      let selectedUrl = null;
      
      // First try adfree_url (less restricted, better for CORS)
      if ((match as any).adfree_url) {
        selectedUrl = (match as any).adfree_url;
        console.log('✅ Using adfree_url (best option):', selectedUrl);
      }
      // Then try dai_url
      else if ((match as any).dai_url) {
        selectedUrl = (match as any).dai_url;
        console.log('📺 Using dai_url:', selectedUrl);
      }
      // Then try existing streamUrl
      else if (match.streamUrl) {
        selectedUrl = match.streamUrl;
        console.log('🔗 Using provided stream URL:', selectedUrl);
      }
      
      if (selectedUrl) {
        setStreamUrl(selectedUrl);
        toast({
          title: "Stream Ready",
          description: "Successfully loaded the stream",
        });
        return;
      }
      
      // Fallback: Try to get stream URL from API using match_id
      console.log('🔄 No direct URLs available, trying API...');
      const matchId = (match as any).match_id || match.id;
      const url = await cricketApi.getStreamUrl(matchId.toString());
      
      if (url) {
        console.log('✅ Got stream URL from API:', url);
        setStreamUrl(url);
        toast({
          title: "Stream Ready", 
          description: "Successfully loaded the stream",
        });
      } else {
        throw new Error('No stream URL available from any source');
      }
    } catch (err) {
      console.error('❌ Failed to fetch stream URL:', err);
      setError('Stream temporarily unavailable. Please try another match.');
      toast({
        title: "Stream Unavailable",
        description: "This stream may be geo-blocked or temporarily down. Try another match.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Watch live cricket stream for {match.title}
          </DialogDescription>
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