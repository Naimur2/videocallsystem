// Frontend configuration using environment variables
import { runtimeConfig } from '../config/runtime';

export const config = {
  // Backend API URL - Auto-detect tunnel vs localhost
  backendUrl: runtimeConfig.backendUrl,

  // Socket.IO URL - Auto-detect tunnel vs localhost  
  socketUrl: runtimeConfig.socketUrl,

  // App configuration
  app: {
    name: runtimeConfig.appName,
    version: runtimeConfig.appVersion,
  },

  // Development settings
  isDevelopment: runtimeConfig.isDevelopment,
  isProduction: runtimeConfig.isProduction,

  // Video call settings
  videoCall: {
    defaultVideoConstraints: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    defaultAudioConstraints: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    maxParticipants: 16,
  },

  // Socket.IO v4+ Optimized Configuration
  socket: {
    // WebSocket-only transport for better performance
    transports: ["websocket"],
    
    // Connection timeouts
    timeout: 20000, // Connection timeout (20s)
    
    // Optimized reconnection settings
    reconnectionAttempts: 15, // More retry attempts
    reconnectionDelay: 1000, // Start with 1s delay
    reconnectionDelayMax: 5000, // Max delay of 5s
    randomizationFactor: 0.5, // Add randomization to prevent thundering herd
    
    // Upgrade settings for WebSocket
    upgrade: true, // Allow transport upgrades
    rememberUpgrade: true, // Remember successful upgrades
    
    // Performance optimizations
    forceNew: false, // Reuse existing connections
    autoConnect: true, // Auto-connect on instantiation
    
    // Additional Socket.IO v4+ optimizations
    closeOnBeforeunload: true, // Close connection on page unload
    
    // Engine.IO options for better performance
    upgradeTimeout: 10000, // Time to wait for upgrade
    maxHttpBufferSize: 1e6, // 1MB max buffer size
  },
  
  // WebRTC configuration optimizations
  webrtc: {
    // ICE servers with optimized configuration
    iceServers: [
      {
        urls: [
          `stun:${runtimeConfig.turnServerHost}:${runtimeConfig.turnServerPort}`,
          'stun:stun.l.google.com:19302'
        ]
      },
      {
        urls: [
          `turn:${runtimeConfig.turnServerHost}:${runtimeConfig.turnServerPort}`,
          `turns:${runtimeConfig.turnServerHost}:5349`
        ],
        username: runtimeConfig.turnUsername,
        credential: runtimeConfig.turnPassword
      }
    ],
    // Optimize ICE gathering
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all' as const
  },
} as const;

export default config;
