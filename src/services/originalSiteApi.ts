import axios from 'axios';
import { CricketMatch } from '@/types/cricket';

// CORS proxies for fetching from the original site
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/'
];

export class OriginalSiteApiService {
  private static instance: OriginalSiteApiService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private currentProxyIndex = 0;

  static getInstance(): OriginalSiteApiService {
    if (!this.instance) {
      this.instance = new OriginalSiteApiService();
    }
    return this.instance;
  }

  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async fetchMatchesFromOriginalSite(): Promise<CricketMatch[]> {
    try {
      const cacheKey = 'original_site_matches';
      const cached = this.getCachedData(cacheKey);
      
      if (cached) {
        return cached;
      }

      console.log('Fetching matches from original site...');
      
      const originalSiteUrl = 'https://webiptv.updatesbyrahul.site/fancycde';
      
      for (let i = 0; i < CORS_PROXIES.length; i++) {
        try {
          const proxyIndex = (this.currentProxyIndex + i) % CORS_PROXIES.length;
          const proxy = CORS_PROXIES[proxyIndex];
          
          const response = await axios.get(`${proxy}${encodeURIComponent(originalSiteUrl)}`, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
          });

          const matches = this.parseMatchesFromHTML(response.data);
          
          if (matches.length > 0) {
            this.currentProxyIndex = proxyIndex;
            this.setCachedData(cacheKey, matches);
            console.log(`Found ${matches.length} matches from original site`);
            return matches;
          }
        } catch (error) {
          console.error(`Proxy ${i + 1} failed:`, error.message);
          continue;
        }
      }

      // Try direct fetch as fallback
      try {
        const response = await axios.get(originalSiteUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });
        
        const matches = this.parseMatchesFromHTML(response.data);
        this.setCachedData(cacheKey, matches);
        return matches;
      } catch (error) {
        console.error('Direct fetch failed:', error.message);
        return [];
      }

    } catch (error) {
      console.error('Error fetching from original site:', error);
      return [];
    }
  }

  private parseMatchesFromHTML(htmlContent: string): CricketMatch[] {
    try {
      const matches: CricketMatch[] = [];
      
      // Extract match data using regex patterns
      const matchPatterns = [
        // Match ID pattern
        /Match ID:(\d+)/g,
        // Match title pattern
        /###\s*(.+?)\s*(?=\n|$)/g,
        // Team names and flags
        /!\[([^\]]+)\]\([^)]+\)/g,
        // Status pattern (LIVE, upcoming time)
        /(LIVE|[\d:]+)/g,
        // Tournament pattern
        /\*\*([^*]+Tournament[^*]*)\*\*/g
      ];

      // Find all match IDs first
      const matchIdMatches = [...htmlContent.matchAll(/Match ID:(\d+)/g)];
      
      matchIdMatches.forEach((matchIdMatch, index) => {
        const matchId = matchIdMatch[1];
        const matchStartIndex = matchIdMatch.index || 0;
        const nextMatchIndex = matchIdMatches[index + 1]?.index || htmlContent.length;
        const matchSection = htmlContent.slice(matchStartIndex - 500, nextMatchIndex);
        
        // Extract match title
        const titleMatch = matchSection.match(/###\s*(.+?)(?=\n)/);
        const title = titleMatch?.[1]?.trim() || 'Cricket Match';
        
        // Extract teams
        const teamMatches = [...matchSection.matchAll(/!\[([^\]]+)\]/g)];
        const teams = teamMatches.map(match => match[1]).filter(team => 
          team && !team.includes('http') && team.length < 50
        );
        
        // Extract tournament
        const tournamentMatch = matchSection.match(/([A-Z][^,\n]+(?:League|Cup|Trophy|Series|Championship|Tournament)[^,\n]*)/i);
        const tournament = tournamentMatch?.[1]?.trim() || 'Cricket Match';
        
        // Extract status
        const isLive = matchSection.includes('LIVE');
        const timeMatch = matchSection.match(/Start Time:([^\n]+)/);
        const startTime = timeMatch?.[1]?.trim() || new Date().toISOString();
        
        // Extract language
        const languageMatch = matchSection.match(/(ENGLISH|HINDI|[A-Z]+)(?=\s|\n)/);
        const language = languageMatch?.[1] || 'ENGLISH';
        
        // Check if streamable
        const isStreamable = !matchSection.includes('Stream not available');
        
        if (teams.length >= 2 && title) {
          matches.push({
            id: `original_${matchId}`,
            title: title,
            team1: {
              name: teams[0],
              shortName: teams[0].substring(0, 3).toUpperCase(),
              flag: this.getTeamFlag(teams[0])
            },
            team2: {
              name: teams[1],
              shortName: teams[1].substring(0, 3).toUpperCase(),
              flag: this.getTeamFlag(teams[1])
            },
            startTime: this.parseStartTime(startTime),
            status: isLive ? 'live' : this.determineStatus(startTime),
            tournament: tournament,
            image: `/api/placeholder/400/200?text=${encodeURIComponent(tournament)}`,
            streamUrl: isStreamable ? this.constructStreamUrl(matchId) : undefined,
            language: language,
            isStreamable: isStreamable
          });
        }
      });

      return matches;
    } catch (error) {
      console.error('Error parsing HTML content:', error);
      return [];
    }
  }

  private parseStartTime(timeString: string): string {
    try {
      // Handle various time formats from the original site
      if (timeString.includes('July 2025') || timeString.includes('2025')) {
        return new Date(timeString).toISOString();
      }
      
      // If it's just a time, assume it's today
      const timeMatch = timeString.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const today = new Date();
        today.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
        return today.toISOString();
      }
      
      return new Date().toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  private determineStatus(startTime: string): 'live' | 'upcoming' | 'completed' {
    const start = new Date(startTime);
    const now = new Date();
    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < -3) return 'completed';
    if (diffHours < 1 && diffHours > -3) return 'live';
    return 'upcoming';
  }

  private getTeamFlag(teamName: string): string {
    const flagMap: { [key: string]: string } = {
      'india': 'https://flagcdn.com/w40/in.png',
      'australia': 'https://flagcdn.com/w40/au.png',
      'england': 'https://flagcdn.com/w40/gb-eng.png',
      'pakistan': 'https://flagcdn.com/w40/pk.png',
      'south africa': 'https://flagcdn.com/w40/za.png',
      'new zealand': 'https://flagcdn.com/w40/nz.png',
      'west indies': 'https://flagcdn.com/w40/bb.png',
      'sri lanka': 'https://flagcdn.com/w40/lk.png',
      'bangladesh': 'https://flagcdn.com/w40/bd.png',
      'afghanistan': 'https://flagcdn.com/w40/af.png'
    };

    const key = teamName.toLowerCase();
    return flagMap[key] || '/api/placeholder/32/32';
  }

  private constructStreamUrl(matchId: string): string {
    // Construct potential stream URLs based on the original site patterns
    const streamUrls = [
      `https://d2ao0uy6gqh4.cloudfront.net/fancode/matches/${matchId}/manifest.m3u8`,
      `https://streaming.fancode.com/hls/${matchId}/playlist.m3u8`,
      `https://fancode.com/match/${matchId}/stream.m3u8`,
    ];
    
    // Return the first URL for now, can be enhanced with testing
    return streamUrls[0];
  }

  // Auto-sync method to be called periodically
  async syncWithOriginalSite(): Promise<CricketMatch[]> {
    console.log('Auto-syncing with original site...');
    return this.fetchMatchesFromOriginalSite();
  }
}

export const originalSiteApi = OriginalSiteApiService.getInstance();