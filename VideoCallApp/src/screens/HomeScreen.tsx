import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { RootStackParamList } from '../../App';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const handleCreateMeeting = () => {
    const roomId = Math.random().toString(36).substring(2, 15);
    navigation.navigate('Join', {roomId});
  };

  const handleJoinMeeting = () => {
    navigation.navigate('Join');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleAbout = () => {
    Alert.alert(
      'About VideoCall',
      'Full-featured video calling app with MediaSoup WebRTC\\n\\nFeatures:\\n• Multi-party video calls\\n• Audio/Video controls\\n• Chat messaging\\n• Screen sharing (coming soon)\\n• Cross-platform support',
      [{text: 'OK'}],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>📹</Text>
          </View>
          <Text style={styles.title}>VideoCall</Text>
          <Text style={styles.subtitle}>Connect with anyone, anywhere</Text>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCreateMeeting}
            activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Create Meeting</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleJoinMeeting}
            activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>Join Meeting</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features</Text>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎥</Text>
            <Text style={styles.featureText}>HD Video Calling</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🎤</Text>
            <Text style={styles.featureText}>Crystal Clear Audio</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureText}>Real-time Chat</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Multi-party Calling</Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.textButton}
            onPress={handleSettings}
            activeOpacity={0.6}>
            <Text style={styles.textButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={handleAbout}
            activeOpacity={0.6}>
            <Text style={styles.textButtonText}>About</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  actionsContainer: {
    marginVertical: 40,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#1e40af',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1e40af',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  textButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  textButtonText: {
    fontSize: 16,
    color: '#60a5fa',
    fontWeight: '500',
  },
});

export default HomeScreen;
