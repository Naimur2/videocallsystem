/**
 * Metered TURN Server Configuration for WebRTC
 * This provides comprehensive TURN server support for MediaSoup on Heroku
 */

export const meteredTurnConfig = {
  iceServers: [
    // STUN servers for NAT detection
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    
    // TURN servers for relay when direct connection fails
    {
      urls: "turn:standard.relay.metered.ca:80",
      username: "0f1eee4f1c2a872fbb855d62",
      credential: "q6s07WgG7GLIq6WM",
    },
    {
      urls: "turn:standard.relay.metered.ca:80?transport=tcp",
      username: "0f1eee4f1c2a872fbb855d62",
      credential: "q6s07WgG7GLIq6WM",
    },
    {
      urls: "turn:standard.relay.metered.ca:443",
      username: "0f1eee4f1c2a872fbb855d62",
      credential: "q6s07WgG7GLIq6WM",
    },
    {
      urls: "turns:standard.relay.metered.ca:443?transport=tcp",
      username: "0f1eee4f1c2a872fbb855d62",
      credential: "q6s07WgG7GLIq6WM",
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
  // Use environment variables if available, otherwise fall back to Metered
  const turnHost = process.env.NEXT_PUBLIC_TURN_SERVER_HOST || 'standard.relay.metered.ca';
  const turnPort = process.env.NEXT_PUBLIC_TURN_SERVER_PORT || '80';
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME || '0f1eee4f1c2a872fbb855d62';
  const turnPassword = process.env.NEXT_PUBLIC_TURN_PASSWORD || 'q6s07WgG7GLIq6WM';
  
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
        urls: `turn:${turnHost}:443`,
        username: turnUsername,
        credential: turnPassword,
      },
      {
        urls: `turns:${turnHost}:443?transport=tcp`,
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