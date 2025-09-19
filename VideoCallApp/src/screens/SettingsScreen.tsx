import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useVideoCallStore } from '../store/videoCallStore';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    isAudioEnabled,
    isVideoEnabled,
    isNotificationsEnabled,
    toggleAudio,
    toggleVideo,
    toggleNotifications,
    leaveRoom,
  } = useVideoCallStore();

  const handleLeaveCall = () => {
    Alert.alert(
      'Leave Call',
      'Are you sure you want to leave the call?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveRoom();
            navigation.navigate('Home' as never);
          },
        },
      ],
    );
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'This would open the issue reporting feature.',
      [{text: 'OK'}],
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'VideoCall App v1.0.0\nBuilt with React Native and MediaSoup',
      [{text: 'OK'}],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media Controls</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Microphone</Text>
              <Text style={styles.settingDescription}>
                Enable or disable your microphone
              </Text>
            </View>
            <Switch
              value={isAudioEnabled}
              onValueChange={toggleAudio}
              trackColor={{false: '#374151', true: '#10b981'}}
              thumbColor={isAudioEnabled ? '#ffffff' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Camera</Text>
              <Text style={styles.settingDescription}>
                Enable or disable your camera
              </Text>
            </View>
            <Switch
              value={isVideoEnabled}
              onValueChange={toggleVideo}
              trackColor={{false: '#374151', true: '#10b981'}}
              thumbColor={isVideoEnabled ? '#ffffff' : '#9ca3af'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications for new messages and calls
              </Text>
            </View>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{false: '#374151', true: '#10b981'}}
              thumbColor={isNotificationsEnabled ? '#ffffff' : '#9ca3af'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Video Quality</Text>

          <TouchableOpacity style={styles.settingButton} activeOpacity={0.7}>
            <Text style={styles.settingButtonText}>HD (720p)</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingButton} activeOpacity={0.7}>
            <Text style={styles.settingButtonText}>Bandwidth Settings</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleReportIssue}
            activeOpacity={0.7}>
            <Text style={styles.settingButtonText}>Report an Issue</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleAbout}
            activeOpacity={0.7}>
            <Text style={styles.settingButtonText}>About</Text>
            <Text style={styles.settingButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerSection}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveCall}
            activeOpacity={0.8}>
            <Text style={styles.leaveButtonText}>Leave Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  settingButtonArrow: {
    fontSize: 16,
    color: '#94a3b8',
  },
  dangerSection: {
    marginTop: 48,
    marginBottom: 32,
  },
  leaveButton: {
    backgroundColor: '#dc2626',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default SettingsScreen;
