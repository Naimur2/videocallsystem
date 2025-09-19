'use client';

import { useEffect, useState } from 'react';

interface AutoplayManagerProps {
  children: React.ReactNode;
}

export const AutoplayManager: React.FC<AutoplayManagerProps> = ({ children }) => {
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if autoplay is supported
    const checkAutoplaySupport = async () => {
      try {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        
        // Try to play an empty video to test autoplay
        const canAutoplay = await video.play().then(() => true).catch(() => false);
        
        if (!canAutoplay) {
          setAutoplayBlocked(true);
        }
        
        video.remove();
      } catch (error) {
        console.log('Autoplay check failed:', error);
        setAutoplayBlocked(true);
      }
    };

    // Add global click handler to enable autoplay
    const handleGlobalClick = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        setAutoplayBlocked(false);
        
        // Enable autoplay for all videos
        const videos = document.querySelectorAll('video[data-needs-click="true"]');
        videos.forEach(async (video) => {
          try {
            await (video as HTMLVideoElement).play();
            video.removeAttribute('data-needs-click');
            (video as HTMLElement).style.setProperty('--show-play-button', 'none');
          } catch (error) {
            console.log('Failed to autoplay video after interaction:', error);
          }
        });
      }
    };

    checkAutoplaySupport();
    document.addEventListener('click', handleGlobalClick, { once: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [hasInteracted]);

  return (
    <>
      {autoplayBlocked && !hasInteracted && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Click anywhere to enable video playback</span>
          </div>
        </div>
      )}
      {children}
    </>
  );
};