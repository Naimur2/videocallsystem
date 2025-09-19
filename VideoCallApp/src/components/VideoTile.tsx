import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { RTCView } from 'react-native-webrtc';

interface VideoTileProps {
  participant: {
    id: string;
    name: string;
    videoStream?: MediaStream | null;
    audioStream?: MediaStream | null;
    isAudioEnabled?: boolean;
    isVideoEnabled?: boolean;
    isHandRaised?: boolean;
  };
  style?: ViewStyle;
  isLocal?: boolean;
}

const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  style,
  isLocal = false,
}) => {
  const videoRef = useRef<any>(null);

  useEffect(() => {
    console.log('[VideoTile] Participant:', participant.name, {
      hasVideoStream: !!participant.videoStream,
      videoEnabled: participant.isVideoEnabled,
      audioEnabled: participant.isAudioEnabled,
      isLocal,
    });
  }, [participant, isLocal]);

  const hasVideo = participant.videoStream && participant.isVideoEnabled;
  const hasAudio = participant.audioStream && participant.isAudioEnabled;

  return (
    <View style={[styles.container, style]}>
      {hasVideo ? (
        <RTCView
          style={styles.video}
          streamURL={participant.videoStream?.toURL() || ''}
          objectFit="cover"
          mirror={isLocal}
        />
      ) : (
        <View style={styles.noVideo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {participant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Participant info overlay */}
      <View style={styles.overlay}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName} numberOfLines={1}>
            {isLocal ? 'You' : participant.name}
          </Text>

          <View style={styles.statusIcons}>
            {!hasAudio && (
              <View style={styles.mutedIcon}>
                <Text style={styles.mutedIconText}>🔇</Text>
              </View>
            )}

            {participant.isHandRaised && (
              <View style={styles.handRaisedIcon}>
                <Text style={styles.handRaisedIconText}>✋</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Connection indicator */}
      <View style={styles.connectionIndicator}>
        <View
          style={[
            styles.connectionDot,
            hasVideo || hasAudio ? styles.connected : styles.disconnected,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    flex: 1,
    backgroundColor: '#000000',
  },
  noVideo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  mutedIconText: {
    fontSize: 10,
  },
  handRaisedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  handRaisedIconText: {
    fontSize: 10,
  },
  connectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connected: {
    backgroundColor: '#10b981',
  },
  disconnected: {
    backgroundColor: '#ef4444',
  },
});

export default VideoTile;
