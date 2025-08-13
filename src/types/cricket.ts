export interface CricketMatch {
  id: string;
  title: string;
  team1: {
    name: string;
    shortName: string;
    flag: string;
    logo?: string;
  };
  team2: {
    name: string;
    shortName: string;
    flag: string;
    logo?: string;
  };
  startTime: string;
  status: 'live' | 'upcoming' | 'completed';
  tournament: string;
  image: string;
  streamUrl?: string;
  language: string;
  isStreamable: boolean;
  quality?: string;
}

export interface LiveStreamData {
  url: string;
  quality: string;
  type: 'm3u8' | 'mp4' | 'webm';
}

export interface ApiResponse {
  success: boolean;
  data?: CricketMatch[];
  error?: string;
}