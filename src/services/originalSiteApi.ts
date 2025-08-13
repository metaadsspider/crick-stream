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
      
      // Enhanced parsing for detailed match information
      // Look for match blocks with more comprehensive data extraction
      const matchBlocks = this.extractMatchBlocks(htmlContent);
      
      matchBlocks.forEach((block, index) => {
        try {
          // Extract match ID
          const matchIdMatch = block.match(/(?:Match ID|ID|match-id)[:\s]*(\d+)/i);
          const matchId = matchIdMatch?.[1] || `auto_${Date.now()}_${index}`;
          
          // Extract comprehensive match title
          const titleMatches = [
            block.match(/###\s*(.+?)(?=\n)/),
            block.match(/\*\*([^*]+vs[^*]+)\*\*/i),
            block.match(/^([A-Z][^,\n]+vs[^,\n]+)/m),
            block.match(/([A-Z][^,\n]+\s+vs\s+[A-Z][^,\n]+)/i)
          ];
          const title = titleMatches.find(m => m)?.[1]?.trim() || 'Live Cricket Match';
          
          // Enhanced team extraction with logos
          const teamData = this.extractTeamData(block);
          
          // Extract tournament with better matching
          const tournament = this.extractTournament(block);
          
          // Extract timing and status
          const { status, startTime } = this.extractMatchStatus(block);
          
          // Extract language and quality info
          const language = this.extractLanguage(block);
          
          // Extract stream information
          const streamInfo = this.extractStreamInfo(block, matchId);
          
          // Extract thumbnail/image
          const thumbnail = this.extractThumbnail(block, tournament);
          
          if (teamData.team1 && teamData.team2) {
            matches.push({
              id: `original_${matchId}`,
              title: title,
              team1: {
                ...teamData.team1,
                logo: teamData.team1.logo || this.getTeamLogo(teamData.team1.name)
              },
              team2: {
                ...teamData.team2,
                logo: teamData.team2.logo || this.getTeamLogo(teamData.team2.name)
              },
              startTime: startTime,
              status: status,
              tournament: tournament,
              image: thumbnail,
              streamUrl: streamInfo.streamUrl,
              language: language,
              isStreamable: streamInfo.isStreamable,
              quality: streamInfo.quality || 'HD'
            });
          }
        } catch (error) {
          console.error(`Error parsing match block ${index}:`, error);
        }
      });

      console.log(`Parsed ${matches.length} matches from original site with enhanced data`);
      return matches;
    } catch (error) {
      console.error('Error parsing HTML content:', error);
      return [];
    }
  }

  private extractMatchBlocks(htmlContent: string): string[] {
    // Split content into match blocks using various delimiters
    const blocks = [];
    
    // Method 1: Split by Match ID
    const idSplits = htmlContent.split(/(?=Match ID:|(?=ID:\s*\d+)|(?=match-id))/i);
    
    // Method 2: Split by match headers
    const headerSplits = htmlContent.split(/(?=###|(?=\*\*[^*]+vs[^*]+\*\*))/i);
    
    // Method 3: Split by team vs team patterns
    const vsSplits = htmlContent.split(/(?=[A-Z][^,\n]+\s+vs\s+[A-Z][^,\n]+)/i);
    
    // Combine and deduplicate blocks
    const allBlocks = [...idSplits, ...headerSplits, ...vsSplits]
      .filter(block => block && block.trim().length > 50)
      .filter(block => block.includes('vs') || block.includes('VS') || block.includes('V/S'));
    
    return allBlocks;
  }

  private extractTeamData(block: string): { team1: any; team2: any } {
    // Extract team names with various patterns
    const teamPatterns = [
      // Pattern 1: Flag images with team names
      /!\[([^\]]+)\]\([^)]+\)/g,
      // Pattern 2: Bold team names
      /\*\*([A-Z][^*]+)\*\*/g,
      // Pattern 3: Direct vs pattern
      /([A-Z][A-Za-z\s]+)\s+(?:vs|V[Ss]|VS)\s+([A-Z][A-Za-z\s]+)/i,
      // Pattern 4: Team names in brackets
      /\[([A-Z][^\]]+)\]/g
    ];

    let teams: string[] = [];
    
    for (const pattern of teamPatterns) {
      const matches = [...block.matchAll(pattern)];
      const extractedTeams = matches
        .map(m => m[1])
        .filter(team => team && !team.includes('http') && team.length < 30 && team.length > 2)
        .slice(0, 2);
      
      if (extractedTeams.length >= 2) {
        teams = extractedTeams;
        break;
      }
    }

    if (teams.length < 2) {
      // Fallback: extract from vs pattern
      const vsMatch = block.match(/([A-Z][A-Za-z\s]{2,20})\s+(?:vs|V[Ss]|VS)\s+([A-Z][A-Za-z\s]{2,20})/i);
      if (vsMatch) {
        teams = [vsMatch[1].trim(), vsMatch[2].trim()];
      }
    }

    return teams.length >= 2 ? {
      team1: {
        name: teams[0],
        shortName: this.generateShortName(teams[0]),
        flag: this.getTeamFlag(teams[0]),
        logo: this.getTeamLogo(teams[0])
      },
      team2: {
        name: teams[1],
        shortName: this.generateShortName(teams[1]),
        flag: this.getTeamFlag(teams[1]),
        logo: this.getTeamLogo(teams[1])
      }
    } : { team1: null, team2: null };
  }

  private extractTournament(block: string): string {
    const tournamentPatterns = [
      /\*\*([^*]*(?:League|Cup|Trophy|Series|Championship|Tournament|T20|ODI|Test)[^*]*)\*\*/i,
      /([A-Z][^,\n]*(?:League|Cup|Trophy|Series|Championship|Tournament|T20|ODI|Test)[^,\n]*)/i,
      /Tournament:\s*([^,\n]+)/i,
      /Series:\s*([^,\n]+)/i
    ];

    for (const pattern of tournamentPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Cricket Match';
  }

  private extractMatchStatus(block: string): { status: 'live' | 'upcoming' | 'completed'; startTime: string } {
    const isLive = /LIVE|🔴|●\s*LIVE/i.test(block);
    
    // Extract time patterns
    const timePatterns = [
      /Start Time:\s*([^,\n]+)/i,
      /Time:\s*([^,\n]+)/i,
      /(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i,
      /(\d{1,2}\/\d{1,2}\/\d{4}[^,\n]*)/,
      /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^,\n]*\d{4})/i
    ];

    let startTime = new Date().toISOString();
    
    for (const pattern of timePatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        startTime = this.parseStartTime(match[1]);
        break;
      }
    }

    const status = isLive ? 'live' : this.determineStatus(startTime);
    return { status, startTime };
  }

  private extractLanguage(block: string): string {
    const langMatch = block.match(/(ENGLISH|HINDI|TAMIL|TELUGU|BENGALI|MARATHI|GUJARATI|KANNADA|[A-Z]{2,})/i);
    return langMatch?.[1]?.toUpperCase() || 'ENGLISH';
  }

  private extractStreamInfo(block: string, matchId: string): { streamUrl?: string; isStreamable: boolean; quality?: string } {
    const isStreamable = !block.includes('Stream not available') && !block.includes('No stream');
    
    // Extract quality info
    const qualityMatch = block.match(/(HD|FHD|4K|720p|1080p|480p)/i);
    const quality = qualityMatch?.[1] || 'HD';
    
    // Look for direct stream URLs
    const urlPatterns = [
      /https?:\/\/[^\s,)]+\.m3u8/i,
      /https?:\/\/[^\s,)]+\/playlist\.m3u8/i,
      /https?:\/\/[^\s,)]+\/manifest\.m3u8/i
    ];

    let streamUrl;
    for (const pattern of urlPatterns) {
      const match = block.match(pattern);
      if (match) {
        streamUrl = match[0];
        break;
      }
    }

    // If no direct URL found, construct one
    if (isStreamable && !streamUrl) {
      streamUrl = this.constructStreamUrl(matchId);
    }

    return { streamUrl, isStreamable, quality };
  }

  private extractThumbnail(block: string, tournament: string): string {
    // Look for image URLs in the block
    const imagePatterns = [
      /!\[[^\]]*\]\(([^)]+\.(?:jpg|jpeg|png|gif|webp))\)/i,
      /https?:\/\/[^\s,)]+\.(?:jpg|jpeg|png|gif|webp)/i,
      /<img[^>]+src=["']([^"']+)["']/i
    ];

    for (const pattern of imagePatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Generate placeholder with tournament name
    return `https://via.placeholder.com/400x200/1a1a1a/ffffff?text=${encodeURIComponent(tournament)}`;
  }

  private generateShortName(teamName: string): string {
    if (!teamName) return 'TM';
    
    // Handle common team name patterns
    const words = teamName.trim().split(/\s+/);
    
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    } else if (words.length === 2) {
      return (words[0][0] + words[1][0] + words[1][1]).toUpperCase();
    } else {
      return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    }
  }

  private getTeamLogo(teamName: string): string {
    const logoMap: { [key: string]: string } = {
      'india': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316654.png',
      'australia': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316655.png',
      'england': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316656.png',
      'pakistan': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316657.png',
      'south africa': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316658.png',
      'new zealand': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316659.png',
      'west indies': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316660.png',
      'sri lanka': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316661.png',
      'bangladesh': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316662.png',
      'afghanistan': 'https://img1.hscicdn.com/image/upload/f_auto/lsci/db/PICTURES/CMS/316600/316663.png'
    };

    const key = teamName.toLowerCase();
    return logoMap[key] || `https://via.placeholder.com/50x50/orange/white?text=${teamName.charAt(0)}`;
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