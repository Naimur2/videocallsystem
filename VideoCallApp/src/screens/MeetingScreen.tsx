import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    BackHandler,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { RootStackParamList } from '../../App';
import ChatModal from '../components/ChatModal';
import ControlPanel from '../components/ControlPanel';
import MeetingHeader from '../components/MeetingHeader';
import ParticipantsModal from '../components/ParticipantsModal';
import VideoTile from '../components/VideoTile';
import { useVideoCallStore } from '../store/videoCallStore';

type MeetingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Meeting'>;
type MeetingScreenRouteProp = RouteProp<RootStackParamList, 'Meeting'>;

interface Props {
  navigation: MeetingScreenNavigationProp;
  route: MeetingScreenRouteProp;
}

const {width, height} = Dimensions.get('window');

const MeetingScreen: React.FC<Props> = ({navigation, route}) => {
  const {roomId, participantName, participantEmail} = route.params;

  const {
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    isConnected,
    isLoading,
    error,
    participants,
    localStream,
    remoteStreams,
    currentRoom,
    isAudioEnabled,
    isVideoEnabled,
    isHandRaised,
    chatMessages,
    clearError,
  } = useVideoCallStore();

  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState('00:00:00');
  const participantsWithStreams = useRef<any[]>([]);

  useEffect(() => {
    // Set meeting start time
    if (currentRoom?.createdAt) {
      setMeetingStartTime(new Date(currentRoom.createdAt).getTime());
    } else if (!meetingStartTime) {
      setMeetingStartTime(Date.now());
    }
  }, [currentRoom, meetingStartTime]);

  useEffect(() => {
    // Update call duration timer
    if (!meetingStartTime) {return;}

    const interval = setInterval(() => {
      const elapsed = Date.now() - meetingStartTime;
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

      setCallDuration(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [meetingStartTime]);

  useEffect(() => {
    // Initialize connection and join room
    const initializeCall = async () => {
      try {
        console.log('[MeetingScreen] Initializing call...');
        connect();

        // Wait a bit for connection to establish
        setTimeout(async () => {
          try {
            await joinRoom(roomId, {
              name: participantName,
              email: participantEmail,
            });
          } catch (err) {
            console.error('[MeetingScreen] Failed to join room:', err);
            Alert.alert(
              'Connection Failed',
              'Unable to join the meeting. Please check your connection and try again.',
              [
                {
                  text: 'Retry',
                  onPress: () => initializeCall(),
                },
                {
                  text: 'Exit',
                  onPress: () => navigation.goBack(),
                },
              ],
            );
          }
        }, 1000);
      } catch (err) {
        console.error('[MeetingScreen] Connection failed:', err);
      }
    };

    initializeCall();

    // Handle hardware back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleLeaveMeeting();
      return true;
    });

    return () => {
      backHandler.remove();
      leaveRoom();
      disconnect();
    };
  }, []);

  useEffect(() => {
    // Handle errors
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: () => clearError(),
        },
      ]);
    }
  }, [error]);

  useEffect(() => {
    // Create participants with combined streams
    participantsWithStreams.current = participants.map(participant => {
      const combinedStream = new MediaStream();

      // Collect all video and audio tracks for this participant
      for (const [key, stream] of remoteStreams.entries()) {
        if (key.startsWith(`${participant.id}:`)) {
          stream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
          stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
        }
      }

      return {
        ...participant,
        videoStream: combinedStream.getTracks().length > 0 ? combinedStream : null,
        audioStream: combinedStream.getTracks().length > 0 ? combinedStream : null,
      };
    });
  }, [participants, remoteStreams]);

  const handleLeaveMeeting = () => {
    Alert.alert(
      'Leave Meeting',
      'Are you sure you want to leave this meeting?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            disconnect();
            navigation.goBack();
          },
        },
      ],
    );
  };

  const renderVideoGrid = () => {
    const allParticipants = [
      {
        id: 'local',
        name: participantName,
        isLocal: true,
        videoStream: localStream,
        audioStream: localStream,
        isAudioEnabled,
        isVideoEnabled,
        isHandRaised,
      },
      ...participantsWithStreams.current,
    ];

    const participantCount = allParticipants.length;
    let columns = 1;
    let rows = 1;

    if (participantCount <= 2) {
      columns = 1;
      rows = participantCount;
    } else if (participantCount <= 4) {
      columns = 2;
      rows = 2;
    } else if (participantCount <= 6) {
      columns = 2;
      rows = 3;
    } else {
      columns = 3;
      rows = Math.ceil(participantCount / 3);
    }

    const tileWidth = (width - 32 - (columns - 1) * 8) / columns;
    const tileHeight = (height * 0.6) / rows;

    return (
      <View style={styles.videoGrid}>
        {allParticipants.map((participant, index) => (
          <VideoTile
            key={participant.id}
            participant={participant}
            style={{
              width: tileWidth,
              height: tileHeight,
              margin: 4,
            }}
            isLocal={participant.isLocal}
          />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Joining meeting...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <MeetingHeader
        roomId={currentRoom?.id || roomId}
        participantCount={participants.length + 1}
        duration={callDuration}
        onLeaveMeeting={handleLeaveMeeting}
      />

      <View style={styles.content}>
        {renderVideoGrid()}
      </View>

      <ControlPanel
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isHandRaised={isHandRaised}
        onToggleAudio={() => useVideoCallStore.getState().toggleAudio()}
        onToggleVideo={() => useVideoCallStore.getState().toggleVideo()}
        onToggleHandRaise={() => useVideoCallStore.getState().toggleHandRaise()}
        onShowParticipants={() => setShowParticipants(true)}
        onShowChat={() => setShowChat(true)}
        onLeaveMeeting={handleLeaveMeeting}
        participantCount={participants.length + 1}
        unreadMessages={0} // TODO: Implement unread message count
      />

      <ParticipantsModal
        visible={showParticipants}
        participants={[
          {
            id: 'local',
            name: participantName,
            email: participantEmail,
            isHost: true,
            isAudioEnabled,
            isVideoEnabled,
            isScreenSharing: false,
            isHandRaised,
            joinedAt: new Date(),
          },
          ...participants,
        ]}
        onClose={() => setShowParticipants(false)}
      />

      <ChatModal
        visible={showChat}
        messages={chatMessages}
        currentUserId="local"
        currentUserName={participantName}
        onSendMessage={(message) => useVideoCallStore.getState().sendMessage(message)}
        onClose={() => setShowChat(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  videoGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MeetingScreen;
