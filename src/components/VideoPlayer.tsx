import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CorsProxy } from '@/services/corsProxy';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
}

export const VideoPlayer = ({ src, poster, title, className }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    console.log('🎥 VideoPlayer: Starting video setup with src:', src);
    setIsLoading(true);
    setError(null);

    let currentHls: Hls | null = null;
    let attemptIndex = 0;

    const tryMultipleUrls = async () => {
      // Get all possible URLs including CORS proxies and Sony Liv bypasses
      const urlsToTry = CorsProxy.getProxiedUrls(src);
      console.log('🔄 Will try', urlsToTry.length, 'different URLs:', urlsToTry);

      const tryNextUrl = async () => {
        if (attemptIndex >= urlsToTry.length) {
          console.error('❌ All URL attempts failed');
          setError('Stream blocked - no working proxy found');
          setIsLoading(false);
          return;
        }

        const currentUrl = urlsToTry[attemptIndex];
        console.log(`🎯 Trying URL ${attemptIndex + 1}/${urlsToTry.length}:`, currentUrl);
        attemptIndex++;

        if (currentUrl.includes('.m3u8') && Hls.isSupported()) {
          await tryHLSWithUrl(currentUrl);
        } else {
          await tryDirectVideoWithUrl(currentUrl);
        }
      };

      const tryHLSWithUrl = async (url: string) => {
        return new Promise<void>((resolve) => {
          console.log('🎥 Trying HLS with URL:', url);
          
          // Clean up previous HLS instance
          if (currentHls) {
            currentHls.destroy();
          }

          const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: false,
            backBufferLength: 10,
            maxBufferLength: 5,
            maxMaxBufferLength: 10,
            manifestLoadingTimeOut: 3000,
            manifestLoadingMaxRetry: 0,
            manifestLoadingRetryDelay: 0,
            fragLoadingTimeOut: 3000,
            fragLoadingMaxRetry: 0,
            capLevelOnFPSDrop: false,
            capLevelToPlayerSize: false,
            xhrSetup: function(xhr: XMLHttpRequest, requestUrl: string) {
              console.log('🌐 XHR Setup for:', requestUrl);
              xhr.withCredentials = false;
              xhr.timeout = 3000;
              
              // Sony Liv / FanCode specific headers
              if (url.includes('sony') || url.includes('fancode') || url.includes('dai.google.com')) {
                xhr.setRequestHeader('Origin', 'https://www.sonyliv.com');
                xhr.setRequestHeader('Referer', 'https://www.sonyliv.com/');
              }
              
              xhr.setRequestHeader('Accept', '*/*');
              xhr.setRequestHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            },
          });

          currentHls = hls;
          hlsRef.current = hls;

          let hasResolved = false;

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (hasResolved) return;
            hasResolved = true;
            console.log('✅ HLS SUCCESS with URL:', url);
            setIsLoading(false);
            video.play().catch(console.error);
            resolve();
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (hasResolved) return;
            console.warn(`⚠️ HLS Error with URL ${url}:`, data.type, data.details);
            
            if (data.fatal || hasResolved) {
              hasResolved = true;
              console.log('🔄 HLS failed, trying next URL...');
              hls.destroy();
              setTimeout(tryNextUrl, 100);
              resolve();
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (!hasResolved) {
              hasResolved = true;
              console.log('⏱️ HLS timeout, trying next URL...');
              hls.destroy();
              tryNextUrl();
              resolve();
            }
          }, 5000);

          hls.loadSource(url);
          hls.attachMedia(video);
        });
      };

      const tryDirectVideoWithUrl = async (url: string) => {
        return new Promise<void>((resolve) => {
          console.log('📹 Trying direct video with URL:', url);
          
          video.removeAttribute('crossorigin');
          video.setAttribute('referrerpolicy', 'no-referrer');
          
          let hasResolved = false;

          const onSuccess = () => {
            if (hasResolved) return;
            hasResolved = true;
            console.log('✅ Direct video SUCCESS with URL:', url);
            setIsLoading(false);
            video.play().catch(console.error);
            resolve();
          };

          const onFailure = () => {
            if (hasResolved) return;
            hasResolved = true;
            console.log('❌ Direct video failed, trying next URL...');
            setTimeout(tryNextUrl, 100);
            resolve();
          };

          video.addEventListener('loadeddata', onSuccess, { once: true });
          video.addEventListener('error', onFailure, { once: true });

          // Timeout fallback
          setTimeout(() => {
            if (!hasResolved) {
              hasResolved = true;
              console.log('⏱️ Direct video timeout, trying next URL...');
              tryNextUrl();
              resolve();
            }
          }, 3000);

          video.src = url;
          video.load();
        });
      };

      // Start trying URLs
      await tryNextUrl();
    };

    tryMultipleUrls();

    return () => {
      if (currentHls) {
        currentHls.destroy();
      }
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      console.log('Video error event:', e);
      // Try to provide more specific error message
      const videoError = (e.target as HTMLVideoElement)?.error;
      if (videoError) {
        console.log('Video error details:', videoError.code, videoError.message);
        switch (videoError.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            setError('Network error - try enabling CORS extension');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError('Stream format not supported');
            break;
          default:
            setError('Video failed to load');
        }
      } else {
        setError('Video failed to load');
      }
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={cn(
        "relative bg-gradient-dark rounded-lg overflow-hidden aspect-video flex items-center justify-center",
        className
      )}>
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <h3 className="text-lg font-semibold text-primary mb-2">Stream Unavailable</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group w-full",
        "aspect-[16/10] sm:aspect-[16/9]", // Better ratio for cricket streams
        "max-w-full", // Ensure it doesn't overflow on mobile
        "fullscreen:rounded-none fullscreen:aspect-auto fullscreen:h-screen fullscreen:w-screen",
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)} // Mobile touch support
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover fullscreen:object-contain"
        poster={poster}
        playsInline
        preload="metadata"
        controls={false} // Hide native controls
        webkit-playsinline="true" // iOS support
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mb-4"></div>
            <p className="text-white">Loading stream...</p>
          </div>
        </div>
      )}


      {/* Controls */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300",
          "p-2 sm:p-4 fullscreen:p-6", // Consistent padding in fullscreen
          showControls ? "opacity-100" : "opacity-0 sm:opacity-0", // Always show on mobile
          "sm:opacity-100 fullscreen:opacity-100" // Always show controls in fullscreen
        )}
      >
        {/* Progress Bar */}
        <div className="mb-2 sm:mb-4 fullscreen:mb-6">
          <div className="bg-white/20 rounded-full h-1 fullscreen:h-2 relative">
            <div 
              className="bg-primary rounded-full h-1 fullscreen:h-2 transition-all duration-300"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4 fullscreen:space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:text-primary hover:bg-white/10 p-2 fullscreen:p-3"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fullscreen:w-6 fullscreen:h-6" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fullscreen:w-6 fullscreen:h-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:text-primary hover:bg-white/10 p-2 fullscreen:p-3"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 fullscreen:w-6 fullscreen:h-6" />
              ) : (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 fullscreen:w-6 fullscreen:h-6" />
              )}
            </Button>

            <div className="text-white text-xs sm:text-sm fullscreen:text-base hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 fullscreen:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:text-primary hover:bg-white/10 p-2 fullscreen:p-3"
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5 fullscreen:w-6 fullscreen:h-6" />
            </Button>
          </div>
        </div>
      </div>


      {/* Live Badge */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 fullscreen:top-6 fullscreen:right-6">
        <div className="bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1 fullscreen:px-4 fullscreen:py-2 rounded-full text-xs sm:text-sm fullscreen:text-base font-bold animate-live-pulse">
          LIVE
        </div>
      </div>
    </div>
  );
};