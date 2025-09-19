import { Alert, Platform } from 'react-native';
import {
    PERMISSIONS,
    RESULTS,
    check,
    openSettings,
    request,
    requestMultiple,
} from 'react-native-permissions';

class PermissionService {
  // Define required permissions for each platform
  private getRequiredPermissions() {
    if (Platform.OS === 'ios') {
      return [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.MICROPHONE];
    } else {
      return [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.RECORD_AUDIO,
        PERMISSIONS.ANDROID.MODIFY_AUDIO_SETTINGS,
      ];
    }
  }

  // Request camera permission
  async requestCameraPermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  // Request microphone permission
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }

  // Request all required permissions for video calling
  async requestVideoCallPermissions(): Promise<{
    camera: boolean;
    microphone: boolean;
    allGranted: boolean;
  }> {
    try {
      const permissions = this.getRequiredPermissions();
      const results = await requestMultiple(permissions);

      const cameraPermission =
        Platform.OS === 'ios'
          ? results[PERMISSIONS.IOS.CAMERA]
          : results[PERMISSIONS.ANDROID.CAMERA];

      const microphonePermission =
        Platform.OS === 'ios'
          ? results[PERMISSIONS.IOS.MICROPHONE]
          : results[PERMISSIONS.ANDROID.RECORD_AUDIO];

      const camera = cameraPermission === RESULTS.GRANTED;
      const microphone = microphonePermission === RESULTS.GRANTED;
      const allGranted = camera && microphone;

      return {camera, microphone, allGranted};
    } catch (error) {
      console.error('Error requesting video call permissions:', error);
      return {camera: false, microphone: false, allGranted: false};
    }
  }

  // Check if permissions are already granted
  async checkPermissions(): Promise<{
    camera: boolean;
    microphone: boolean;
    allGranted: boolean;
  }> {
    try {
      const cameraPermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const microphonePermission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const [cameraResult, microphoneResult] = await Promise.all([
        check(cameraPermission),
        check(microphonePermission),
      ]);

      const camera = cameraResult === RESULTS.GRANTED;
      const microphone = microphoneResult === RESULTS.GRANTED;
      const allGranted = camera && microphone;

      return {camera, microphone, allGranted};
    } catch (error) {
      console.error('Error checking permissions:', error);
      return {camera: false, microphone: false, allGranted: false};
    }
  }

  // Show permission denied alert with option to open settings
  showPermissionDeniedAlert(
    permissionType: 'camera' | 'microphone' | 'both',
  ) {
    const getPermissionMessage = () => {
      switch (permissionType) {
        case 'camera':
          return 'Camera access is required for video calling. Please enable it in Settings.';
        case 'microphone':
          return 'Microphone access is required for audio calling. Please enable it in Settings.';
        case 'both':
          return 'Camera and microphone access are required for video calling. Please enable them in Settings.';
        default:
          return 'Permissions are required for video calling. Please enable them in Settings.';
      }
    };

    Alert.alert(
      'Permission Required',
      getPermissionMessage(),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => openSettings(),
        },
      ],
    );
  }

  // Handle permission flow for joining a video call
  async handleVideoCallPermissions(): Promise<boolean> {
    // First check existing permissions
    const currentPermissions = await this.checkPermissions();

    if (currentPermissions.allGranted) {
      return true;
    }

    // Request missing permissions
    const permissionResults = await this.requestVideoCallPermissions();

    if (!permissionResults.allGranted) {
      // Determine which permissions were denied
      if (!permissionResults.camera && !permissionResults.microphone) {
        this.showPermissionDeniedAlert('both');
      } else if (!permissionResults.camera) {
        this.showPermissionDeniedAlert('camera');
      } else if (!permissionResults.microphone) {
        this.showPermissionDeniedAlert('microphone');
      }

      return false;
    }

    return true;
  }

  // Handle permission for audio-only calls
  async handleAudioCallPermissions(): Promise<boolean> {
    const currentPermissions = await this.checkPermissions();

    if (currentPermissions.microphone) {
      return true;
    }

    const microphoneGranted = await this.requestMicrophonePermission();

    if (!microphoneGranted) {
      this.showPermissionDeniedAlert('microphone');
      return false;
    }

    return true;
  }
}

export const permissionService = new PermissionService();
export default permissionService;
