import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { RootStackParamList } from '../../App';

type JoinScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Join'>;
type JoinScreenRouteProp = RouteProp<RootStackParamList, 'Join'>;

interface Props {
  navigation: JoinScreenNavigationProp;
  route: JoinScreenRouteProp;
}

const JoinScreen: React.FC<Props> = ({navigation, route}) => {
  const [roomId, setRoomId] = useState(route.params?.roomId || '');
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (route.params?.roomId) {
      setRoomId(route.params.roomId);
    }
  }, [route.params?.roomId]);

  const validateInput = () => {
    if (!roomId.trim()) {
      Alert.alert('Error', 'Please enter a meeting ID');
      return false;
    }
    if (!participantName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (participantName.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters long');
      return false;
    }
    return true;
  };

  const handleJoinMeeting = async () => {
    if (!validateInput()) {return;}

    setIsJoining(true);

    try {
      navigation.navigate('Meeting', {
        roomId: roomId.trim(),
        participantName: participantName.trim(),
        participantEmail: participantEmail.trim() || undefined,
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      Alert.alert('Error', 'Failed to join meeting. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const generateRandomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 15);
    setRoomId(newRoomId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Meeting</Text>
            <Text style={styles.subtitle}>Enter meeting details to join</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meeting ID</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.flexInput]}
                  value={roomId}
                  onChangeText={setRoomId}
                  placeholder="Enter meeting ID"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateRandomId}
                  activeOpacity={0.7}>
                  <Text style={styles.generateButtonText}>Generate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={styles.input}
                value={participantName}
                onChangeText={setParticipantName}
                placeholder="Enter your name"
                placeholderTextColor="#64748b"
                autoCapitalize="words"
                maxLength={50}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                value={participantEmail}
                onChangeText={setParticipantEmail}
                placeholder="Enter your email"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.joinButton,
                (!roomId.trim() || !participantName.trim() || isJoining) && styles.joinButtonDisabled,
              ]}
              onPress={handleJoinMeeting}
              disabled={!roomId.trim() || !participantName.trim() || isJoining}
              activeOpacity={0.8}>
              <Text style={[
                styles.joinButtonText,
                (!roomId.trim() || !participantName.trim() || isJoining) && styles.joinButtonTextDisabled,
              ]}>
                {isJoining ? 'Joining...' : 'Join Meeting'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.6}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              💡 Tip: Share the meeting ID with others to invite them
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#334155',
  },
  flexInput: {
    flex: 1,
    marginRight: 12,
  },
  generateButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: '#1e40af',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  joinButtonDisabled: {
    backgroundColor: '#374151',
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  joinButtonTextDisabled: {
    color: '#9ca3af',
  },
  cancelButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
  },
  info: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default JoinScreen;
