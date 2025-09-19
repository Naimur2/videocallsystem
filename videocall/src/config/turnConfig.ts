/**
 * CoTURN Server Configuration for WebRTC
 * Self-hosted TURN server for enterprise-grade MediaSoup connectivity
 */

export const meteredTurnConfig = {
  iceServers: [
    // STUN servers for NAT detection
    {
      urls: "stun:meeting.naimur-rahaman.com:3478",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    
    // CoTURN servers for relay when direct connection fails
    {
      urls: "turn:meeting.naimur-rahaman.com:3478",
      username: "mediasoup",
      credential: "mediasoupTurn2024!",
    },
    {
      urls: "turn:meeting.naimur-rahaman.com:3478?transport=tcp",
      username: "mediasoup",
      credential: "mediasoupTurn2024!",
    },
    {
      urls: "turns:meeting.naimur-rahaman.com:5349",
      username: "mediasoup",
      credential: "mediasoupTurn2024!",
    },
    {
      urls: "turns:meeting.naimur-rahaman.com:5349?transport=tcp",
      username: "mediasoup",
      credential: "mediasoupTurn2024!",
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
};

/**
 * Get TURN configuration with environment variable fallback
 */
export function getTurnConfiguration() {
  // Use environment variables if available, otherwise fall back to self-hosted CoTURN
  const turnHost = process.env.NEXT_PUBLIC_TURN_SERVER_HOST || 'meeting.naimur-rahaman.com';
  const turnPort = process.env.NEXT_PUBLIC_TURN_SERVER_PORT || '3478';
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME || 'mediasoup';
  const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD || 'mediasoupTurn2024!';
  
  return {
    iceServers: [
      {
        urls: `stun:${turnHost}:${turnPort}`,
      },
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: `turn:${turnHost}:${turnPort}`,
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: `turn:${turnHost}:${turnPort}?transport=tcp`,
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: `turns:${turnHost}:5349`,
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: `turns:${turnHost}:5349?transport=tcp`,
        username: turnUsername,
        credential: turnPassword,
      },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
  };
}

/**
 * Test TURN server connectivity
 */
export async function testTurnConnectivity(): Promise<boolean> {
  try {
    const pc = new RTCPeerConnection(getTurnConfiguration());
    
    return new Promise((resolve) => {
      let turnServerWorking = false;
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE Candidate:', event.candidate.candidate);
          if (event.candidate.candidate.includes('relay')) {
            turnServerWorking = true;
            console.log('✅ TURN server is working!');
            resolve(true);
          }
        }
      };
      
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          if (!turnServerWorking) {
            console.log('⚠️  TURN server test completed, but no relay candidates found');
            resolve(false);
          }
        }
      };
      
      // Create a data channel to trigger ICE gathering
      pc.createDataChannel('test');
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
      });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!turnServerWorking) {
          console.log('⚠️  TURN server test timed out');
          resolve(false);
        }
        pc.close();
      }, 10000);
    });
  } catch (error) {
    console.error('❌ TURN server test failed:', error);
    return false;
  }
}

export default meteredTurnConfig;