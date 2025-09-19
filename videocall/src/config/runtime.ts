/**
 * Runtime Environment Configuration
 * This file provides environment variables that can be accessed at runtime
 * Fallbacks ensure the app works even if build-time env vars are missing
 */

// Build-time environment variables (from Docker build args)
const buildTimeConfig = {
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  turnServerHost: process.env.NEXT_PUBLIC_TURN_SERVER_HOST,
  turnServerPort: process.env.NEXT_PUBLIC_TURN_SERVER_PORT,
  turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME,
  turnPassword: process.env.NEXT_PUBLIC_TURN_PASSWORD,
  appName: process.env.NEXT_PUBLIC_APP_NAME,
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
};

// Runtime fallbacks (when build-time vars are not available)
const runtimeFallbacks = {
  backendUrl: typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/api`
    : 'https://meeting.naimur-rahaman.com/api',
  socketUrl: typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://meeting.naimur-rahaman.com',
  turnServerHost: 'meeting.naimur-rahaman.com',
  turnServerPort: '3478',
  turnUsername: 'mediasoup',
  turnPassword: 'mediasoupTurn2024!',
  appName: 'MediaSoup Video Call',
  appVersion: '1.0.0',
};

// Export final configuration with fallbacks
export const runtimeConfig = {
  backendUrl: buildTimeConfig.backendUrl || runtimeFallbacks.backendUrl,
  socketUrl: buildTimeConfig.socketUrl || runtimeFallbacks.socketUrl,
  turnServerHost: buildTimeConfig.turnServerHost || runtimeFallbacks.turnServerHost,
  turnServerPort: buildTimeConfig.turnServerPort || runtimeFallbacks.turnServerPort,
  turnUsername: buildTimeConfig.turnUsername || runtimeFallbacks.turnUsername,
  turnPassword: buildTimeConfig.turnPassword || runtimeFallbacks.turnPassword,
  appName: buildTimeConfig.appName || runtimeFallbacks.appName,
  appVersion: buildTimeConfig.appVersion || runtimeFallbacks.appVersion,
  
  // Development detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default runtimeConfig;