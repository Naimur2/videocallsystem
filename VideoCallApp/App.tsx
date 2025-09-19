/**
 * VideoCall Mobile App
 * Full-featured video calling app with MediaSoup WebRTC
 */

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { LogBox, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import HomeScreen from './src/screens/HomeScreen';
import JoinScreen from './src/screens/JoinScreen';
import MeetingScreen from './src/screens/MeetingScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Ignore specific warnings
LogBox.ignoreLogs([
  'new NativeEventEmitter',
  'Non-serializable values were found in the navigation state',
]);

export type RootStackParamList = {
  Home: undefined;
  Join: {roomId?: string};
  Meeting: {roomId: string; participantName: string; participantEmail?: string};
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1f2937',
            },
            headerTintColor: '#ffffff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'VideoCall'}}
          />
          <Stack.Screen
            name="Join"
            component={JoinScreen}
            options={{title: 'Join Meeting'}}
          />
          <Stack.Screen
            name="Meeting"
            component={MeetingScreen}
            options={{
              title: 'Meeting',
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
