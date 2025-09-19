import React from 'react';

interface VideoDebugOverlayProps {
  stream?: MediaStream | null;
  participant?: { name?: string };
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const VideoDebugOverlay: React.FC<VideoDebugOverlayProps> = ({
  stream,
  participant,
  position = 'top-left'
}) => {
  const [debugInfo, setDebugInfo] = React.useState<any>({});

  React.useEffect(() => {
    if (!stream) return;

    const updateDebugInfo = () => {
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      const info = {
        streamId: stream.id,
        active: stream.active,
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoTrack: videoTracks[0] ? {
          enabled: videoTracks[0].enabled,
          muted: videoTracks[0].muted,
          readyState: videoTracks[0].readyState,
          settings: videoTracks[0].getSettings?.()
        } : null
      };
      
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, [stream]);

  if (!stream) return null;

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono z-10`}>
      <div className="space-y-1">
        <div>ID: {debugInfo.streamId?.slice(0, 8)}</div>
        <div>Active: {debugInfo.active ? '✅' : '❌'}</div>
        <div>Tracks: {debugInfo.videoTracks}V/{debugInfo.audioTracks}A</div>
        {debugInfo.videoTrack && (
          <>
            <div>
              State: {debugInfo.videoTrack.readyState} 
              {debugInfo.videoTrack.enabled ? ' EN' : ' DIS'}
              {debugInfo.videoTrack.muted ? ' MUT' : ' UNM'}
            </div>
            {debugInfo.videoTrack.settings && (
              <div>
                {debugInfo.videoTrack.settings.width}x{debugInfo.videoTrack.settings.height}
                @{debugInfo.videoTrack.settings.frameRate}fps
              </div>
            )}
          </>
        )}
        {participant?.name && (
          <div>User: {participant.name}</div>
        )}
      </div>
    </div>
  );
};
