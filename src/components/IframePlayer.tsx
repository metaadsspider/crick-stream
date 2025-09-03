import React from 'react';
import { cn } from '@/lib/utils';

interface IframePlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export const IframePlayer = ({ src, title, className }: IframePlayerProps) => {
  // Create iframe-friendly URLs for different streaming services
  const getIframeUrl = (originalSrc: string) => {
    // Sony Liv iframe approach
    if (originalSrc.includes('sonyliv.com') || originalSrc.includes('dai.google.com')) {
      return `data:text/html;charset=utf-8,
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background: black; }
              video { width: 100%; height: 100vh; object-fit: contain; }
            </style>
          </head>
          <body>
            <video controls autoplay crossorigin="anonymous" referrerpolicy="no-referrer">
              <source src="${originalSrc}" type="application/x-mpegURL">
              <source src="${originalSrc}" type="video/mp4">
            </video>
            <script>
              const video = document.querySelector('video');
              video.addEventListener('error', (e) => {
                console.log('Iframe video error:', e);
                // Try removing crossorigin
                video.removeAttribute('crossorigin');
                video.load();
              });
            </script>
          </body>
        </html>`;
    }

    // For other sources, try direct embedding
    return originalSrc;
  };

  const iframeUrl = getIframeUrl(src);

  return (
    <div className={cn(
      "relative bg-black rounded-lg overflow-hidden w-full aspect-video",
      className
    )}>
      <iframe
        src={iframeUrl}
        title={title || "Live Stream"}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-presentation allow-top-navigation"
        referrerPolicy="no-referrer"
      />
      
      {/* Overlay message */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
        📺 Alternative Player
      </div>
    </div>
  );
};