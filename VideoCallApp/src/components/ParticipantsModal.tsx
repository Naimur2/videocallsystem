import React from 'react';
import {
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Participant } from '../types';

interface ParticipantsModalProps {
  visible: boolean;
  participants: Participant[];
  onClose: () => void;
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  visible,
  participants,
  onClose,
}) => {
  const renderParticipant = ({item}: {item: Participant}) => (
    <View style={styles.participantItem}>
      <View style={styles.participantInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{item.name}</Text>
          {item.email && (
            <Text style={styles.participantEmail}>{item.email}</Text>
          )}
          {item.isHost && (
            <Text style={styles.hostBadge}>Host</Text>
          )}
        </View>
      </View>

      <View style={styles.participantStatus}>
        <View style={[
          styles.statusIcon,
          item.isAudioEnabled ? styles.audioEnabled : styles.audioDisabled,
        ]}>
          <Text style={styles.statusIconText}>
            {item.isAudioEnabled ? '🎤' : '🔇'}
          </Text>
        </View>

        <View style={[
          styles.statusIcon,
          item.isVideoEnabled ? styles.videoEnabled : styles.videoDisabled,
        ]}>
          <Text style={styles.statusIconText}>
            {item.isVideoEnabled ? '📹' : '📴'}
          </Text>
        </View>

        {item.isHandRaised && (
          <View style={styles.handRaisedIcon}>
            <Text style={styles.statusIconText}>✋</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Participants ({participants.length})
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          style={styles.participantsList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.inviteButton}
            activeOpacity={0.8}>
            <Text style={styles.inviteButtonText}>Invite Others</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  participantsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  hostBadge: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '500',
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  audioEnabled: {
    backgroundColor: '#10b981',
  },
  audioDisabled: {
    backgroundColor: '#dc2626',
  },
  videoEnabled: {
    backgroundColor: '#10b981',
  },
  videoDisabled: {
    backgroundColor: '#374151',
  },
  handRaisedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusIconText: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  inviteButton: {
    backgroundColor: '#1e40af',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ParticipantsModal;
