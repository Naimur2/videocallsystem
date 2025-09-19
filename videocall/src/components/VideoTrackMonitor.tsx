import React from 'react';

interface VideoTrackMonitorProps {
  track?: MediaStreamTrack;
  onTrackStateChange?: (state: any) => void;
}

export const VideoTrackMonitor: React.FC<VideoTrackMonitorProps> = ({
  track,
  onTrackStateChange
}) => {
  React.useEffect(() => {
    if (!track) return;

    const updateState = () => {
      const state = {
        id: track.id,
        kind: track.kind,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings: track.getSettings?.(),
        constraints: track.getConstraints?.(),
        capabilities: track.getCapabilities?.(),
      };
      
      onTrackStateChange?.(state);
    };

    updateState();

    // Event listeners
    const handleEnded = () => {
      console.log(`[VideoTrackMonitor] Track ${track.id} ended`);
      updateState();
    };

    const handleMute = () => {
      console.log(`[VideoTrackMonitor] Track ${track.id} muted`);
      updateState();
    };

    const handleUnmute = () => {
      console.log(`[VideoTrackMonitor] Track ${track.id} unmuted`);
      updateState();
    };

    track.addEventListener('ended', handleEnded);
    track.addEventListener('mute', handleMute);
    track.addEventListener('unmute', handleUnmute);

    // Periodic state check
    const interval = setInterval(updateState, 2000);

    return () => {
      clearInterval(interval);
      track.removeEventListener('ended', handleEnded);
      track.removeEventListener('mute', handleMute);
      track.removeEventListener('unmute', handleUnmute);
    };
  }, [track, onTrackStateChange]);

  // This is a monitoring component, doesn't render anything visible
  return null;
};
