import { useState, useEffect, useCallback } from 'react';
import { SkullHeader } from '@/components/SkullHeader';
import { MatchCard } from '@/components/MatchCard';
import { StreamModal } from '@/components/StreamModal';
import { CricketMatch } from '@/types/cricket';
import { cricketApi } from '@/services/cricketApi';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi } from 'lucide-react';

const Index = () => {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<CricketMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<CricketMatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Dynamic auto-refresh based on match timing
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30000);

  const fetchMatches = useCallback(async (showToast = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await cricketApi.fetchLiveMatches();
      
      if (response.success && response.data) {
        setMatches(response.data);
        setLastUpdated(new Date());
        
        // Update refresh interval based on match timing
        const newInterval = cricketApi.getRefreshInterval(response.data);
        setAutoRefreshInterval(newInterval);
        
        if (showToast) {
          const liveCount = response.data.filter(m => m.status === 'live').length;
          toast({
            title: "Updated Successfully",
            description: `Loaded ${response.data.length} matches (${liveCount} live)`,
          });
        }
      } else {
        setError(response.error || 'Failed to fetch matches');
        toast({
          title: "Update Failed",
          description: response.error || 'Failed to fetch matches',
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('Network error occurred');
      toast({
        title: "Network Error",
        description: "Check your internet connection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Enhanced auto-refresh every 20 seconds with original site sync
  useEffect(() => {
    console.log('🔄 Setting up 20-second auto-refresh for live streams...');
    
    // Auto-sync with original site every 20 seconds for real-time updates
    const syncInterval = setInterval(async () => {
      try {
        console.log('📡 Syncing with original site for latest streams...');
        await cricketApi.syncWithOriginalSite();
        fetchMatches();
      } catch (error) {
        console.error('❌ Sync failed:', error);
      }
    }, 20000); // 20 seconds

    // Primary refresh every 20 seconds
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing match data...');
      fetchMatches();
    }, 20000); // 20 seconds

    return () => {
      clearInterval(syncInterval);
      clearInterval(refreshInterval);
    };
  }, [fetchMatches]);

  // Filter and search logic
  useEffect(() => {
    let filtered = matches;

    // Apply filter
    switch (currentFilter) {
      case 'live':
        filtered = matches.filter(match => match.status === 'live');
        break;
      case 'upcoming':
        filtered = matches.filter(match => match.status === 'upcoming');
        break;
      case 'streamable':
        filtered = matches.filter(match => match.isStreamable);
        break;
      default:
        filtered = matches;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(match =>
        match.title.toLowerCase().includes(query) ||
        match.team1.name.toLowerCase().includes(query) ||
        match.team2.name.toLowerCase().includes(query) ||
        match.tournament.toLowerCase().includes(query)
      );
    }

    setFilteredMatches(filtered);
  }, [matches, currentFilter, searchQuery]);

  const handleWatchMatch = (match: CricketMatch) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    fetchMatches(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
  };

  const getMatchCounts = () => {
    return {
      total: matches.length,
      live: matches.filter(m => m.status === 'live').length,
      upcoming: matches.filter(m => m.status === 'upcoming').length,
    };
  };

  const counts = getMatchCounts();

  if (error && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-dark p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="text-6xl mb-6">💀</div>
            <h1 className="text-3xl font-bold text-primary mb-4">Skull Crick News</h1>
            <p className="text-xl text-muted-foreground mb-6">Failed to load cricket matches</p>
            <div className="text-sm text-destructive mb-6">{error}</div>
            <Button
              onClick={() => fetchMatches(true)}
              className="bg-gradient-skull hover:shadow-skull"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff6b35' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 container mx-auto p-4 space-y-6">
        {/* Header */}
        <SkullHeader
          totalMatches={counts.total}
          liveMatches={counts.live}
          upcomingMatches={counts.upcoming}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          currentFilter={currentFilter}
          className="animate-slide-up"
        />

        {/* Matches Grid */}
        <div className="space-y-4">
          {isLoading && matches.length === 0 ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((match, index) => (
                <div
                  key={match.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MatchCard
                    match={match}
                    onWatch={handleWatchMatch}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* No Matches Found */
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🏏</div>
              <h3 className="text-xl font-semibold text-muted-foreground mb-4">
                No matches found
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery 
                  ? `No matches found for "${searchQuery}"`
                  : `No ${currentFilter} matches available`
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="hover:bg-muted/50"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Connection Status */}
        {!navigator.onLine && (
          <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Offline</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground">
          <div className="space-y-2">
            <p>
              <span className="text-primary font-semibold">Skull Crick News</span> - 
              Your ultimate destination for live cricket streaming
            </p>
            <p className="text-xs">
              Built with ❤️ for cricket fans worldwide | 
              <button 
                onClick={() => window.open('https://t.me/skullcricknews', '_blank')}
                className="text-accent hover:underline ml-1"
              >
                Join our Telegram
              </button>
            </p>
          </div>
        </footer>
      </div>

      {/* Stream Modal */}
      <StreamModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMatch(null);
        }}
      />
    </div>
  );
};

export default Index;