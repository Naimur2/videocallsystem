import { TransportListenIp, WorkerLogLevel } from "mediasoup/node/lib/types";

/**
 * MediaSoup configuration optimized for Heroku deployment
 * 
 * Key considerations for Heroku:
 * 1. No UDP port support - must use TCP or external TURN
 * 2. Dynamic port assignment by Heroku
 * 3. Ephemeral filesystem - no persistent storage
 * 4. 30-second request timeout
 * 5. Memory and CPU limitations
 */

export const mediasoupHerokuConfig = {
  // Worker settings - optimized for Heroku resources
  worker: {
    rtcMinPort: parseInt(process.env.RTC_MIN_PORT || '40000'),
    rtcMaxPort: parseInt(process.env.RTC_MAX_PORT || '40099'), // Smaller range for Heroku
    logLevel: (process.env.MEDIASOUP_LOG_LEVEL as WorkerLogLevel) || 'warn',
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
    ],
  },

  // Router settings - optimized codecs for bandwidth efficiency
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        parameters: {
          'sprop-stereo': 1,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
          'x-google-max-bitrate': 2000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
          'profile-id': 2,
          'x-google-start-bitrate': 1000,
          'x-google-max-bitrate': 2000,
        },
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
          'x-google-max-bitrate': 2000,
        },
      },
    ] as any[], // Type assertion to avoid complex MediaSoup type issues
  },

  // WebRTC transport settings - configured for Heroku limitations
  webRtcTransport: {
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
      },
    ] as TransportListenIp[],
    
    // Bandwidth settings optimized for Heroku
    maxIncomingBitrate: 1500000,  // 1.5 Mbps max incoming
    initialAvailableOutgoingBitrate: 1000000, // 1 Mbps initial outgoing
    minimumAvailableOutgoingBitrate: 600000,  // 600 Kbps minimum
    maxSctpMessageSize: 262144,
    
    // Transport protocol settings for Heroku
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,  // Still prefer UDP when available
    preferTcp: false,
    
    // ICE settings optimized for Heroku + Metered TURN
    iceServers: [
      {
        urls: ['stun:stun.l.google.com:19302'],
      },
      {
        urls: ['stun:stun.relay.metered.ca:80'],
      },
      // Metered TURN server configuration (comprehensive setup)
      {
        urls: [
          'turn:standard.relay.metered.ca:80',
          'turn:standard.relay.metered.ca:80?transport=tcp',
          'turn:standard.relay.metered.ca:443',
          'turns:standard.relay.metered.ca:443?transport=tcp'
        ],
        username: '0f1eee4f1c2a872fbb855d62',
        credential: 'q6s07WgG7GLIq6WM',
      },
    ],
  },

  // Plain transport settings (for recording, if needed)
  plainTransport: {
    listenIp: {
      ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
      announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
    } as TransportListenIp,
    maxSctpMessageSize: 262144,
  },

  // Producer settings - optimized for Heroku resource constraints
  producer: {
    // Lower quality settings to reduce CPU/memory usage
    keyFrameRequestDelay: 5000,
    videoEncodings: [
      {
        rid: 'r0',
        maxBitrate: 100000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r1',
        maxBitrate: 300000,
        scalabilityMode: 'S1T3',
      },
      {
        rid: 'r2',
        maxBitrate: 900000,
        scalabilityMode: 'S1T3',
      },
    ],
  },

  // Consumer settings
  consumer: {
    rtcpFeedback: [
      { type: 'nack' },
      { type: 'ccm', parameter: 'fir' },
      { type: 'google-remb' },
      { type: 'transport-cc' },
    ],
  },
};

// Helper function to get Heroku-specific configuration
export function getHerokuMediaSoupConfig() {
  const config = { ...mediasoupHerokuConfig };
  
  // Override settings based on Heroku environment
  if (process.env.NODE_ENV === 'production') {
    // Production optimizations
    config.worker.logLevel = 'warn';
    config.webRtcTransport.maxIncomingBitrate = 1000000; // Reduce for production
  }
  
  // If no TURN server is configured, warn about potential issues
  if (!process.env.TURN_SERVER_HOST) {
    console.warn('⚠️  No TURN server configured! WebRTC may fail behind NAT/firewalls.');
    console.warn('   Consider using Twilio TURN, Xirsys, or deploying your own COTURN server.');
  }
  
  return config;
}

// Export default configuration
export default mediasoupHerokuConfig;