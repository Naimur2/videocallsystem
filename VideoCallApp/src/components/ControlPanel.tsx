import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ControlPanelProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isHandRaised: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleHandRaise: () => void;
  onShowParticipants: () => void;
  onShowChat: () => void;
  onLeaveMeeting: () => void;
  participantCount: number;
  unreadMessages: number;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  isHandRaised,
  onToggleAudio,
  onToggleVideo,
  onToggleHandRaise,
  onShowParticipants,
  onShowChat,
  onLeaveMeeting,
  participantCount,
  unreadMessages,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controlsRow}>
        {/* Audio Toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            isAudioEnabled ? styles.enabledButton : styles.disabledButton,
          ]}
          onPress={onToggleAudio}
          activeOpacity={0.7}>
          <Text style={styles.controlIcon}>
            {isAudioEnabled ? '🎤' : '🔇'}
          </Text>
        </TouchableOpacity>

        {/* Video Toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            isVideoEnabled ? styles.enabledButton : styles.disabledButton,
          ]}
          onPress={onToggleVideo}
          activeOpacity={0.7}>
          <Text style={styles.controlIcon}>
            {isVideoEnabled ? '📹' : '📴'}
          </Text>
        </TouchableOpacity>

        {/* Hand Raise */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            isHandRaised ? styles.handRaisedButton : styles.normalButton,
          ]}
          onPress={onToggleHandRaise}
          activeOpacity={0.7}>
          <Text style={styles.controlIcon}>✋</Text>
        </TouchableOpacity>

        {/* Participants */}
        <TouchableOpacity
          style={[styles.controlButton, styles.normalButton]}
          onPress={onShowParticipants}
          activeOpacity={0.7}>
          <Text style={styles.controlIcon}>👥</Text>
          {participantCount > 1 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{participantCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity
          style={[styles.controlButton, styles.normalButton]}
          onPress={onShowChat}
          activeOpacity={0.7}>
          <Text style={styles.controlIcon}>💬</Text>
          {unreadMessages > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadMessages}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Leave Meeting */}
        <TouchableOpacity
          style={[styles.controlButton, styles.leaveButton]}
          onPress={onLeaveMeeting}
          activeOpacity={0.7}>
          <Text style={styles.controlIcon}>📞</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  enabledButton: {
    backgroundColor: '#374151',
  },
  disabledButton: {
    backgroundColor: '#dc2626',
  },
  normalButton: {
    backgroundColor: '#374151',
  },
  handRaisedButton: {
    backgroundColor: '#f59e0b',
  },
  leaveButton: {
    backgroundColor: '#dc2626',
  },
  controlIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default ControlPanel;
