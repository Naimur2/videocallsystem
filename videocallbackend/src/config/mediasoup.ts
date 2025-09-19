import {
  RtpCodecCapability,
  TransportListenInfo,
  WorkerLogLevel,
  WorkerLogTag
} from "mediasoup/node/lib/types";

// MediaSoup configuration interface
interface MediasoupConfig {
  worker: {
    rtcMinPort: number;
    rtcMaxPort: number;
    logLevel: WorkerLogLevel;
    logTags: WorkerLogTag[];
  };
  webRtcServer?: {
    listenInfos: Array<{
      protocol: 'udp' | 'tcp';
      ip: string;
      announcedAddress?: string;
      port: number;
    }>;
  };
  router: {
    mediaCodecs: RtpCodecCapability[];
  };
  webRtcTransport: {
    listenInfos: TransportListenInfo[];
    maxIncomingBitrate: number;
    initialAvailableOutgoingBitrate: number;
    maxOutgoingBitrate: number;
    minimumAvailableOutgoingBitrate: number;
    enableUdp?: boolean;
    enableTcp?: boolean;
    preferUdp?: boolean;
  };
}

// Get environment variables with fallbacks
const MEDIASOUP_LISTEN_IP = process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0";
const MEDIASOUP_ANNOUNCED_IP =
  process.env.MEDIASOUP_ANNOUNCED_IP || "call.naimur-rahaman.com";
const RTC_MIN_PORT = parseInt(process.env.RTC_MIN_PORT || "40000");
const RTC_MAX_PORT = parseInt(process.env.RTC_MAX_PORT || "49999");

console.log("MediaSoup Configuration:", {
  MEDIASOUP_LISTEN_IP,
  MEDIASOUP_ANNOUNCED_IP,
  RTC_MIN_PORT,
  RTC_MAX_PORT,
});

// Unified MediaSoup configuration
const config: MediasoupConfig = {
  worker: {
    rtcMinPort: RTC_MIN_PORT,
    rtcMaxPort: RTC_MAX_PORT,
    logLevel: "debug" as WorkerLogLevel, // Enhanced debugging
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
      // 'rtx',
      // 'bwe',
      // 'score',
      // 'simulcast',
      // 'svc'
    ],
  },

  // WebRTC Server configuration (MediaSoup demo pattern)
  webRtcServer: {
    listenInfos: [
      {
        protocol: 'udp' as const,
        ip: '0.0.0.0',
        announcedAddress: MEDIASOUP_ANNOUNCED_IP, // Use direct IP: 103.168.206.10
        port: 44444 // Single WebRTC server port
      },
      {
        protocol: 'tcp' as const,
        ip: '0.0.0.0', 
        announcedAddress: MEDIASOUP_ANNOUNCED_IP, // Use direct IP: 103.168.206.10
        port: 44444 // Same port for TCP fallback
      }
    ]
  },

  router: {
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
        preferredPayloadType: 111,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        preferredPayloadType: 96,
        parameters: {
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video",
        mimeType: "video/VP9",
        clockRate: 90000,
        preferredPayloadType: 97,
        parameters: {
          "profile-id": 2,
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video",
        mimeType: "video/h264",
        clockRate: 90000,
        preferredPayloadType: 98,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "4d0032",
          "level-asymmetry-allowed": 1,
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video",
        mimeType: "video/h264",
        clockRate: 90000,
        preferredPayloadType: 99,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
          "level-asymmetry-allowed": 1,
          "x-google-start-bitrate": 1000,
        },
      },
    ],
  },

  webRtcTransport: {
    listenInfos: [
      {
        protocol: "udp" as const,
        ip: MEDIASOUP_LISTEN_IP,
        announcedAddress: MEDIASOUP_ANNOUNCED_IP,
      },
      {
        protocol: "tcp" as const,
        ip: MEDIASOUP_LISTEN_IP,
        announcedAddress: MEDIASOUP_ANNOUNCED_IP,
      },
    ],
    maxIncomingBitrate: 1500000,
    initialAvailableOutgoingBitrate: 1000000,
    maxOutgoingBitrate: 3000000,
    minimumAvailableOutgoingBitrate: 600000,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  },
};

// ICE/TURN server configuration - MediaSoup best practices with multiple STUN servers
export const iceServers = [
  // Multiple STUN servers for redundancy and better connectivity
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302", 
      "stun:stun2.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302"
    ]
  },
  // Additional reliable STUN servers
  {
    urls: [
      "stun:stun.relay.metered.ca:80",
      "stun:global.stun.twilio.com:3478"
    ]
  },
  // Local COTURN server via external IP (more reliable than ngrok for TURN)
  {
    urls: `turn:${MEDIASOUP_ANNOUNCED_IP}:8443`,
    username: "mediasoup-user",
    credential: "mediasoup-turn-secret-2024"
  },
  {
    urls: `turn:${MEDIASOUP_ANNOUNCED_IP}:8443?transport=tcp`,
    username: "mediasoup-user", 
    credential: "mediasoup-turn-secret-2024"
  },
  // Backup professional TURN servers for critical scenarios
  {
    urls: "turn:relay.metered.ca:80",
    username: "0f1eee4f1c2a872fbb855d62",
    credential: "q6s07WgG7GLIq6WM"
  },
  {
    urls: "turn:relay.metered.ca:443?transport=tcp", 
    username: "0f1eee4f1c2a872fbb855d62",
    credential: "q6s07WgG7GLIq6WM"
  }
];

export default config;
