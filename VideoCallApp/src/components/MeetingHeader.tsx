import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface MeetingHeaderProps {
  roomId: string;
  participantCount: number;
  duration: string;
  onLeaveMeeting: () => void;
}

const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  roomId,
  participantCount,
  duration,
  onLeaveMeeting,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.roomId} numberOfLines={1}>
            Room: {roomId}
          </Text>
          <Text style={styles.participantCount}>
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.duration}>{duration}</Text>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={onLeaveMeeting}
            activeOpacity={0.7}>
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  roomId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  participantCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  duration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  leaveButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MeetingHeader;
