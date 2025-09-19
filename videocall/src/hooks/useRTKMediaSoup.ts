import { useMediaSoupSessionQuery, useProduceMediaMutation } from '@/store/api/mediaSoupApi';
import { useCallback, useEffect, useState } from 'react';

interface UseRTKMediaSoupProps {
  serverUrl: string;
  roomId: string;
  userId: string;
  userName: string;
  autoReconnect?: boolean;
}

export const useRTKMediaSoup = ({
  serverUrl,
  roomId,
  userId,
  userName,
  autoReconnect = true
}: UseRTKMediaSoupProps) => {
  
  // Local state for streams
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [localAudioStream, setLocalAudioStream] = useState<MediaStream | null>(null);
  
  // 🎯 SINGLE RTK QUERY - HANDLES EVERYTHING WITH IMPROVED ERROR HANDLING
  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch: restartSession
  } = useMediaSoupSessionQuery({
    serverUrl,
    roomId,
    userId,
    userName
  }, {
    // Retry failed requests
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
    refetchOnFocus: false, // Don't refetch on window focus to avoid interruptions
  });
  
  // Auto-reconnect on errors
  useEffect(() => {
    if (isError && autoReconnect && error) {
      console.log('🔄 Auto-reconnecting due to error:', error);
      const timeoutId = setTimeout(() => {
        restartSession();
      }, 3000); // Wait 3 seconds before retry
      
      return () => clearTimeout(timeoutId);
    }
  }, [isError, autoReconnect, error, restartSession]);
  
  const [produceMedia] = useProduceMediaMutation();
  
  // ===== SIMPLE ACTIONS WITH IMPROVED ERROR HANDLING =====
  const startVideo = useCallback(async () => {
    if (!session || !session.isReady) {
      console.warn('⚠️ Cannot start video: session not ready');
      return false;
    }
    
    try {
      const result = await produceMedia({
        sessionData: session,
        kind: 'video',
        constraints: { width: 1280, height: 720, frameRate: 30 }
      });
      
      if ('data' in result && result.data?.success) {
        if (result.data.stream) {
          setLocalVideoStream(result.data.stream);
          console.log('✅ Local video stream set:', result.data.stream);
        }
        return true;
      } else if ('error' in result) {
        console.error('❌ Video production failed:', result.error);
      }
      return false;
    } catch (error) {
      console.error('Failed to start video:', error);
      return false;
    }
  }, [session, produceMedia]);
  
  const startAudio = useCallback(async () => {
    if (!session || !session.isReady) {
      console.warn('⚠️ Cannot start audio: session not ready');
      return false;
    }
    
    try {
      const result = await produceMedia({
        sessionData: session,
        kind: 'audio'
      });
      
      if ('data' in result && result.data?.success) {
        if (result.data.stream) {
          setLocalAudioStream(result.data.stream);
          console.log('✅ Local audio stream set:', result.data.stream);
        }
        return true;
      } else if ('error' in result) {
        console.error('❌ Audio production failed:', result.error);
      }
      return false;
    } catch (error) {
      console.error('Failed to start audio:', error);
      return false;
    }
  }, [session, produceMedia]);
  
  const stopVideo = useCallback(() => {
    try {
      if (session?.videoProducer && !session.videoProducer.closed) {
        session.videoProducer.close();
        console.log('✅ Video stopped');
      }
      if (localVideoStream) {
        localVideoStream.getTracks().forEach(track => track.stop());
        setLocalVideoStream(null);
        console.log('✅ Local video stream stopped');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to stop video:', error);
      return false;
    }
  }, [session, localVideoStream]);
  
  const stopAudio = useCallback(() => {
    try {
      if (session?.audioProducer && !session.audioProducer.closed) {
        session.audioProducer.close();
        console.log('✅ Audio stopped');
      }
      if (localAudioStream) {
        localAudioStream.getTracks().forEach(track => track.stop());
        setLocalAudioStream(null);
        console.log('✅ Local audio stream stopped');
      }
      return true;
    } catch (error) {
      console.error('❌ Failed to stop audio:', error);
      return false;
    }
  }, [session, localAudioStream]);
  
  // ===== COMPUTED STATE =====
  const isReady = session?.isReady ?? false;
  const isConnected = session?.isConnected ?? false;
  const hasVideo = !!session?.videoProducer && !!localVideoStream;
  const hasAudio = !!session?.audioProducer && !!localAudioStream;
  const participantCount = session?.participants?.length ?? 0;
  
  return {
    // Session state
    session,
    isLoading,
    isError,
    error,
    isReady,
    isConnected,
    
    // Media state
    hasVideo,
    hasAudio,
    localVideoStream,
    localAudioStream,
    
    // Participants
    participants: session?.participants ?? [],
    participantCount,
    
    // Actions
    startVideo,
    startAudio,
    stopVideo,
    stopAudio,
    restartSession,
    
    // Raw data for advanced use
    device: session?.device,
    sendTransport: session?.sendTransport,
    recvTransport: session?.recvTransport,
    videoProducer: session?.videoProducer,
    audioProducer: session?.audioProducer,
  };
};

export default useRTKMediaSoup;