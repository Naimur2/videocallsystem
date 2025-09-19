# MediaSoup Video Call - Debugging Guide

## Common Issues and Solutions

### 1. **Users Can't See Each Other's Video**

**Symptoms:**

- Users can see their own camera
- Can't see remote participants' video
- Video elements appear empty or black

**Debug Steps:**

1. **Check Browser Console (F12)**

   ```javascript
   // Look for these errors:
   - MediaSoup initialization errors
   - WebRTC transport errors
   - Socket.IO connection issues
   - Device/getUserMedia permissions
   ```

2. **Check Network Tab**

   ```
   - Socket.IO connection established?
   - WebRTC TURN server requests successful?
   - Any 4xx/5xx API errors?
   ```

3. **Check Application State**
   ```javascript
   // In browser console, check store state:
   window.__videocall_store__ = useVideoCallStore.getState();
   console.log(
     "MediaSoup initialized:",
     window.__videocall_store__.isMediaSoupInitialized
   );
   console.log("RTP Capabilities:", window.__videocall_store__.rtpCapabilities);
   console.log("Remote Streams:", window.__videocall_store__.remoteStreams);
   ```

### 2. **Connection/Socket Issues**

**Symptoms:**

- Can't join meetings
- "Server disconnected" errors
- Frequent disconnections

**Debug Steps:**

1. **Check Backend Health**

   ```bash
   curl http://localhost:3001/api/v1/health
   ```

2. **Check Socket Connection**

   ```javascript
   // In browser console:
   const socket = useVideoCallStore.getState().socket;
   console.log("Socket connected:", socket?.connected);
   console.log("Socket ID:", socket?.id);
   ```

3. **Check Container Status**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs backend --tail=20
   ```

### 3. **MediaSoup Specific Issues**

**Symptoms:**

- MediaSoup initialization fails
- Transport creation errors
- Producer/Consumer errors

**Debug Steps:**

1. **Check RTP Capabilities**

   ```javascript
   // Should show supported codecs
   const store = useVideoCallStore.getState();
   console.log("RTP Capabilities:", store.rtpCapabilities);
   ```

2. **Check Transport Creation**

   ```javascript
   // Both transports should exist
   const store = useVideoCallStore.getState();
   console.log("Send Transport:", store.sendTransport);
   console.log("Receive Transport:", store.recvTransport);
   ```

3. **Check Producers/Consumers**
   ```javascript
   // Should show active media producers
   const store = useVideoCallStore.getState();
   console.log("Audio Producer:", store.audioProducer);
   console.log("Video Producer:", store.videoProducer);
   console.log("Remote Streams:", store.remoteStreams);
   ```

### 4. **TURN Server Issues**

**Symptoms:**

- Connection works locally but fails externally
- "ICE connection failed" errors
- Can't connect through NAT/Firewall

**Debug Steps:**

1. **Check TURN Server Health**

   ```bash
   docker-compose -f docker-compose.prod.yml logs turn-server --tail=10
   ```

2. **Verify ICE Candidates**

   ```javascript
   // In browser console during call:
   // Should see both STUN and TURN candidates
   ```

3. **Test TURN Connectivity**
   ```bash
   # External TURN server test (if available)
   turnutils_stunclient 103.168.206.14:3478
   ```

## Debugging Commands

### Check All Container Status

```bash
cd f:\codes\mediasoup-video-call
docker-compose -f docker-compose.prod.yml ps
```

### View Recent Logs

```bash
# Backend logs (MediaSoup)
docker-compose -f docker-compose.prod.yml logs backend --tail=20

# Frontend logs
docker-compose -f docker-compose.prod.yml logs frontend --tail=20

# TURN server logs
docker-compose -f docker-compose.prod.yml logs turn-server --tail=20
```

### Test Services

```bash
# Backend health
curl http://localhost:3001/api/v1/health

# Frontend response
curl http://localhost:3000

# Nginx proxy
curl http://localhost:80
```

### Browser Console Tests

```javascript
// Get current store state
const store = useVideoCallStore.getState();

// Check MediaSoup status
console.log("MediaSoup Status:", {
  initialized: store.isMediaSoupInitialized,
  rtpCapabilities: !!store.rtpCapabilities,
  sendTransport: !!store.sendTransport,
  recvTransport: !!store.recvTransport,
  audioProducer: !!store.audioProducer,
  videoProducer: !!store.videoProducer,
  remoteStreams: store.remoteStreams.size,
});

// Check socket connection
console.log("Socket Status:", {
  connected: store.socket?.connected,
  id: store.socket?.id,
  socketConnected: store.isSocketConnected,
  appConnected: store.isConnected,
});

// Check media status
console.log("Media Status:", {
  localStream: !!store.localStream,
  audioEnabled: store.isAudioEnabled,
  videoEnabled: store.isVideoEnabled,
  screenSharing: store.isScreenSharing,
});
```

## Expected Normal Flow

### 1. Successful Room Join

```
[VideoCallStore] Connecting to socket: ws://localhost:3001
[VideoCallStore] Socket connected
[VideoCallStore] Successfully joined room: XXXXXX
[VideoCallStore] Initializing MediaSoup...
[VideoCallStore] ✅ MediaSoup initialized successfully
[VideoCallStore] Creating MediaSoup transports...
[VideoCallStore] ✅ MediaSoup transports created successfully
[VideoCallStore] Starting to produce media...
[VideoCallStore] ✅ Audio producer created: XXXXXX
[VideoCallStore] ✅ Video producer created: XXXXXX
```

### 2. Remote Participant Join

```
[VideoCallStore] New producer from USER_ID: PRODUCER_ID (video)
[VideoCallStore] Consuming media from USER_ID:PRODUCER_ID
[VideoCallStore] ✅ Successfully consuming media from USER_ID
```

### 3. Normal Operation

```
- Local video stream visible in preview
- Remote video streams visible in grid
- Audio working between participants
- Screen sharing replaces video when activated
- Connection remains stable
```

## If All Else Fails

1. **Rebuild Everything**

   ```bash
   cd f:\codes\mediasoup-video-call
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

2. **Check Browser Compatibility**

   - Use Chrome/Edge (best MediaSoup support)
   - Enable camera/microphone permissions
   - Disable browser extensions that might block WebRTC

3. **Network Issues**

   - Test locally first (http://localhost:3000)
   - Then test via ngrok URL
   - Check firewall/antivirus settings

4. **Contact Support**
   - Provide browser console logs
   - Provide container logs
   - Specify exact symptoms and steps to reproduce
