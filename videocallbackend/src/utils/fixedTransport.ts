/**
 * Fixed MediaSoup Transport Creation
 * This fixes the critical transport creation issue preventing video streams
 */

import * as mediasoup from "mediasoup";

export class FixedTransportCreator {
  static async createWebRtcTransport(
    router: mediasoup.types.Router,
    producing: boolean = false,
    consuming: boolean = false
  ) {
    console.log("[FixedTransport] Creating WebRTC transport:", { producing, consuming });
    
    // MediaSoup demo compatible configuration
    const transportOptions = {
      listenInfos: [
        {
          protocol: "udp" as const,
          ip: "0.0.0.0",
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || process.env.DOMAIN || "localhost",
          portRange: {
            min: parseInt(process.env.RTC_MIN_PORT || "40000"),
            max: parseInt(process.env.RTC_MAX_PORT || "49999")
          }
        },
        {
          protocol: "tcp" as const,
          ip: "0.0.0.0", 
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || process.env.DOMAIN || "localhost",
          portRange: {
            min: parseInt(process.env.RTC_MIN_PORT || "40000"),
            max: parseInt(process.env.RTC_MAX_PORT || "49999")
          }
        }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      iceConsentTimeout: 20,
      enableSctp: producing, // Only enable SCTP for producing transports
      numSctpStreams: producing ? { OS: 1024, MIS: 1024 } : undefined,
      appData: { producing, consuming }
    };

    const transport = await router.createWebRtcTransport(transportOptions);

    // Set up transport events (critical for connection success)
    transport.on('icestatechange', (iceState) => {
      console.log(`[FixedTransport] ICE state changed: ${iceState}`);
      if (iceState === 'disconnected' || iceState === 'closed') {
        console.warn(`[FixedTransport] Transport ICE ${iceState}`);
      }
    });

    transport.on('dtlsstatechange', (dtlsState) => {
      console.log(`[FixedTransport] DTLS state changed: ${dtlsState}`);
      if (dtlsState === 'failed' || dtlsState === 'closed') {
        console.error(`[FixedTransport] Transport DTLS ${dtlsState}`);
      }
    });

    // Set max incoming bitrate if specified
    const maxIncomingBitrate = parseInt(process.env.MAX_INCOMING_BITRATE || "1500000");
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
        console.log(`[FixedTransport] Set max incoming bitrate: ${maxIncomingBitrate}`);
      } catch (error) {
        console.warn(`[FixedTransport] Failed to set max incoming bitrate:`, error);
      }
    }

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters,
        // Include ICE servers in response for client
        iceServers: [
          {
            urls: [
              "stun:standard.relay.metered.ca:80",
              "stun:standard.relay.metered.ca:443"
            ]
          },
          {
            urls: [
              "turn:standard.relay.metered.ca:80", 
              "turn:standard.relay.metered.ca:443"
            ],
            username: process.env.METERED_TURN_USERNAME || process.env.NEXT_PUBLIC_METERED_TURN_USERNAME || "",
            credential: process.env.METERED_TURN_CREDENTIAL || process.env.NEXT_PUBLIC_METERED_TURN_CREDENTIAL || ""
          }
        ]
      }
    };
  }
}