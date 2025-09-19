// Frontend configuration using environment variables
export const config = {
  // Backend API URL - Auto-detect tunnel vs localhost
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
      ? `${window.location.protocol}//${window.location.host}`  // Use same domain when accessed via tunnel
      : "http://localhost:3201"),  // Fixed port: 3201 not 3001

  // Socket.IO URL - Auto-detect tunnel vs localhost  
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
      ? `${window.location.protocol}//${window.location.host}`  // Use same domain when accessed via tunnel
      : "http://localhost:3201"),  // Fixed port: 3201 not 3001

  // App configuration
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "MediaSoup Video Call",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  },

  // Development settings
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

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
          'stun:standard.relay.metered.ca:80',
          'stun:standard.relay.metered.ca:443'
        ]
      },
      {
        urls: [
          'turn:standard.relay.metered.ca:80',
          'turn:standard.relay.metered.ca:443'
        ],
        username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME || '',
        credential: process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL || ''
      }
    ],
    // Optimize ICE gathering
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all' as const
  },
} as const;

export default config;
