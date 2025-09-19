import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import * as mediasoupClient from 'mediasoup-client';
import { io, Socket } from 'socket.io-client';

// Socket management with proper cleanup
class SocketManager {
  private static instance: SocketManager;
  private sockets = new Map<string, Socket>();
  
  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }
  
  async createSocket(key: string, serverUrl: string): Promise<Socket> {
    // Clean up existing socket for this key
    await this.cleanupSocket(key);
    
    console.log(`🔌 Creating new socket for: ${key}`);
    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      forceNew: true,
    });
    
    // Add error handling
    socket.on('connect_error', (error) => {
      console.error(`❌ Socket connection error for ${key}:`, error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected for ${key}:`, reason);
    });
    
    this.sockets.set(key, socket);
    return socket;
  }
  
  async cleanupSocket(key: string): Promise<void> {
    const existingSocket = this.sockets.get(key);
    if (existingSocket) {
      console.log(`🧹 Cleaning up socket for: ${key}`);
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
      this.sockets.delete(key);
    }
  }
  
  getSocket(key: string): Socket | undefined {
    return this.sockets.get(key);
  }
}

// Complete MediaSoup session state
interface MediaSoupSession {
  roomId: string;
  userId: string;
  userName: string;
  device: mediasoupClient.Device | null;
  sendTransport: any | null;
  recvTransport: any | null;
  videoProducer: any | null;
  audioProducer: any | null;
  participants: Array<{
    id: string;
    name: string;
    videoConsumer?: any;
    audioConsumer?: any;
    videoStream?: MediaStream;
    audioStream?: MediaStream;
  }>;
  localVideoStream?: MediaStream;
  localAudioStream?: MediaStream;
  isReady: boolean;
  isConnected: boolean;
  socketKey: string;
}

export const mediaSoupApi = createApi({
  reducerPath: 'mediaSoupApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Session', 'Media'],
  
  endpoints: (builder) => ({
    
    // SINGLE ENDPOINT - COMPLETE MEDIASOUP SESSION 🎯
    mediaSoupSession: builder.query<MediaSoupSession, {
      serverUrl: string;
      roomId: string;
      userId: string;
      userName: string;
    }>({
      queryFn: async ({ roomId, userId, userName }) => {
        const socketKey = `${roomId}-${userId}`;
        // Return initial state - real work happens in onCacheEntryAdded
        return {
          data: {
            roomId,
            userId,
            userName,
            device: null,
            sendTransport: null,
            recvTransport: null,
            videoProducer: null,
            audioProducer: null,
            participants: [],
            isReady: false,
            isConnected: false,
            socketKey
          }
        };
      },
      
      // 🪄 ALL MEDIASOUP MAGIC HAPPENS HERE
      onCacheEntryAdded: async (
        { serverUrl, roomId, userId, userName },
        { cacheEntryRemoved, updateCachedData }
      ) => {
        const socketManager = SocketManager.getInstance();
        const socketKey = `${roomId}-${userId}`;
        let socket: Socket | null = null;
        
        try {
          console.log('🚀 RTK: Starting complete MediaSoup session');
          
          // ===== STEP 1: SOCKET CONNECTION =====
          console.log('🔌 Connecting to:', serverUrl);
          socket = await socketManager.createSocket(socketKey, serverUrl);
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout after 5s')), 5000);
            
            socket!.on('connect', () => {
              console.log('✅ Socket connected');
              clearTimeout(timeout);
              resolve();
            });
            
            socket!.on('connect_error', (error) => {
              console.error('❌ Socket connection error:', error);
              clearTimeout(timeout);
              reject(error);
            });
          });
          
          updateCachedData((draft) => {
            draft.isConnected = true;
          });
          
          // ===== STEP 2: JOIN ROOM =====
          console.log('🏠 Joining room:', roomId);
          const roomData = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Join room timeout')), 10000);
            
            // CRITICAL FIX: Backend expects 'participantName', not 'userName'
            socket!.emit('joinRoom', { roomId, participantName: userName, userEmail: undefined });
            
            socket!.once('roomJoined', (data) => {
              clearTimeout(timeout);
              resolve(data);
            });
            
            socket!.once('error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
          
          console.log('✅ Room joined:', roomData);
          
          // ===== STEP 3: GET RTP CAPABILITIES =====
          console.log('📡 Getting router RTP capabilities');
          const rtpCapabilities = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('RTP capabilities timeout')), 10000);
            
            socket!.emit('getRouterRtpCapabilities', (capabilities: any) => {
              clearTimeout(timeout);
              resolve(capabilities);
            });
          });
          
          console.log('✅ RTP capabilities received');
          
          // ===== STEP 4: INITIALIZE DEVICE =====
          console.log('📱 Initializing MediaSoup device');
          const device = new mediasoupClient.Device();
          await device.load({ routerRtpCapabilities: rtpCapabilities });
          
          updateCachedData((draft) => {
            draft.device = device;
          });
          console.log('✅ Device initialized');
          
          // ===== STEP 5: CREATE SEND TRANSPORT =====
          console.log('📤 Creating send transport');
          const sendTransportData = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Send transport timeout')), 10000);
            
            socket!.emit('createWebRtcTransport', { direction: 'send' });
            
            socket!.once('webRtcTransportCreated', (data) => {
              clearTimeout(timeout);
              resolve(data);
            });
            
            socket!.once('error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
          
          const sendTransport = device.createSendTransport(sendTransportData);
          
          // Send transport events
          sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
              console.log('🔗 Connecting send transport');
              socket!.emit('connectTransport', {
                transportId: sendTransport.id,
                dtlsParameters,
              });
              
              const connected = await new Promise<boolean>((resolve) => {
                const timeout = setTimeout(() => resolve(false), 10000);
                
                socket!.once('transportConnected', () => {
                  clearTimeout(timeout);
                  resolve(true);
                });
                
                socket!.once('error', () => {
                  clearTimeout(timeout);
                  resolve(false);
                });
              });
              
              if (connected) {
                console.log('✅ Send transport connected');
                callback();
              } else {
                throw new Error('Send transport connection failed');
              }
            } catch (error) {
              console.error('❌ Send transport connection error:', error);
              errback(new Error('Send transport connection failed'));
            }
          });
          
          sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            try {
              console.log(`🎥 Producing ${kind}`);
              socket!.emit('produce', {
                transportId: sendTransport.id,
                kind,
                rtpParameters,
              });
              
              const result = await new Promise<any>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Production timeout')), 10000);
                
                socket!.once('produced', (data) => {
                  clearTimeout(timeout);
                  resolve(data);
                });
                
                socket!.once('error', (error) => {
                  clearTimeout(timeout);
                  reject(error);
                });
              });
              
              console.log(`✅ ${kind} produced:`, result.producerId);
              callback({ id: result.producerId });
              
              // Update cache with producer
              updateCachedData((draft) => {
                if (kind === 'video') draft.videoProducer = { id: result.producerId, kind };
                if (kind === 'audio') draft.audioProducer = { id: result.producerId, kind };
              });
              
            } catch (error) {
              console.error(`❌ ${kind} production failed:`, error);
              errback(new Error(`${kind} production failed`));
            }
          });
          
          updateCachedData((draft) => {
            draft.sendTransport = sendTransport;
          });
          console.log('✅ Send transport created');
          
          // ===== STEP 5: CREATE RECEIVE TRANSPORT =====
          console.log('📥 Creating receive transport');
          const recvTransportData = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Recv transport timeout')), 10000);
            
            socket!.emit('createWebRtcTransport', { direction: 'recv' });
            
            socket!.once('webRtcTransportCreated', (data) => {
              clearTimeout(timeout);
              resolve(data);
            });
            
            socket!.once('error', (error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
          
          const recvTransport = device.createRecvTransport(recvTransportData);
          
          // Receive transport events
          recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            try {
              console.log('🔗 Connecting receive transport');
              socket!.emit('connectTransport', {
                transportId: recvTransport.id,
                dtlsParameters,
              });
              
              const connected = await new Promise<boolean>((resolve) => {
                const timeout = setTimeout(() => resolve(false), 10000);
                
                socket!.once('transportConnected', () => {
                  clearTimeout(timeout);
                  resolve(true);
                });
                
                socket!.once('error', () => {
                  clearTimeout(timeout);
                  resolve(false);
                });
              });
              
              if (connected) {
                console.log('✅ Receive transport connected');
                callback();
              } else {
                throw new Error('Receive transport connection failed');
              }
            } catch (error) {
              console.error('❌ Receive transport connection error:', error);
              errback(new Error('Receive transport connection failed'));
            }
          });
          
          updateCachedData((draft) => {
            draft.recvTransport = recvTransport;
          });
          console.log('✅ Receive transport created');
          
          // ===== STEP 6: SETUP PARTICIPANT LISTENERS =====
          socket!.on('newProducer', async ({ participantId, producerId, kind }) => {
            console.log(`👤 New ${kind} producer from:`, participantId);
            
            try {
              // Get consume data
              const consumeData = await new Promise<any>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Consume timeout')), 10000);
                
                socket!.emit('consume', {
                  transportId: recvTransport.id,
                  producerId,
                  rtpCapabilities: device.rtpCapabilities,
                });
                
                socket!.once('consumed', (data) => {
                  clearTimeout(timeout);
                  resolve(data);
                });
                
                socket!.once('error', (error) => {
                  clearTimeout(timeout);
                  reject(error);
                });
              });
              
              // Create consumer
              const consumer = await recvTransport.consume({
                id: consumeData.id,
                producerId: consumeData.producerId,
                kind: consumeData.kind,
                rtpParameters: consumeData.rtpParameters,
              });
              
              // Create stream
              const stream = new MediaStream([consumer.track]);
              
              // Resume consumer
              socket!.emit('resumeConsumer', { roomId, consumerId: consumer.id });
              
              // Update cache
              updateCachedData((draft) => {
                let participant = draft.participants.find(p => p.id === participantId);
                if (!participant) {
                  participant = { id: participantId, name: `User ${participantId}` };
                  draft.participants.push(participant);
                }
                
                if (kind === 'video') {
                  participant.videoConsumer = consumer;
                  participant.videoStream = stream;
                }
                if (kind === 'audio') {
                  participant.audioConsumer = consumer;
                  participant.audioStream = stream;
                }
              });
              
              console.log(`✅ ${kind} consumed from:`, participantId);
            } catch (error) {
              console.error(`❌ Failed to consume ${kind}:`, error);
            }
          });

          // ===== HANDLE DIRECT CONSUMER CREATION (New MediaSoup demo pattern) =====
          socket!.on('newConsumer', async ({ peerId, producerId, id, kind, rtpParameters, type, appData, producerPaused }) => {
            console.log(`🍽️ Direct consumer received: ${kind} from ${peerId}`);
            
            try {
              // Create the consumer directly using provided parameters
              const consumer = await recvTransport.consume({
                id,
                producerId,
                kind,
                rtpParameters,
              });
              
              // Store the consumer
              updateCachedData((draft) => {
                if (!draft.consumers) {
                  draft.consumers = new Map();
                }
                draft.consumers.set(id, consumer);
              });
              
              // Create stream from consumer track
              const stream = new MediaStream([consumer.track]);
              
              // Resume the consumer
              socket!.emit('resumeConsumer', { consumerId: id });
              
              // Update participant data
              updateCachedData((draft) => {
                let participant = draft.participants.find(p => p.id === peerId);
                if (!participant) {
                  participant = { id: peerId, name: `User ${peerId}` };
                  draft.participants.push(participant);
                }
                
                if (kind === 'video') {
                  participant.videoConsumer = consumer;
                  participant.videoStream = stream;
                } else if (kind === 'audio') {
                  participant.audioConsumer = consumer;
                  participant.audioStream = stream;
                }
              });
              
              console.log(`✅ Direct consumer created: ${kind} from ${peerId}`);
            } catch (error) {
              console.error(`❌ Failed to create direct consumer:`, error);
            }
          });
          
          socket!.on('participantLeft', ({ participantId }) => {
            console.log('👋 Participant left:', participantId);
            updateCachedData((draft) => {
              draft.participants = draft.participants.filter(p => p.id !== participantId);
            });
          });
          
          // ===== STEP 7: ADD EXISTING PARTICIPANTS =====
          roomData.participants?.forEach((participant: any) => {
            if (participant.id !== userId) {
              updateCachedData((draft) => {
                draft.participants.push({
                  id: participant.id,
                  name: participant.name
                });
              });
            }
          });
          
          // ===== STEP 8: MARK AS READY =====
          updateCachedData((draft) => {
            draft.isReady = true;
          });
          
          console.log('🎉 RTK: MediaSoup session ready!');
          
          // ===== CLEANUP ON UNMOUNT =====
          await cacheEntryRemoved;
          
          console.log('🧹 Cleaning up MediaSoup session');
          
          // Clean up MediaSoup resources
          try {
            if (sendTransport && !sendTransport.closed) {
              sendTransport.close();
            }
            if (recvTransport && !recvTransport.closed) {
              recvTransport.close();
            }
          } catch (cleanupError) {
            console.error('❌ Transport cleanup error:', cleanupError);
          }
          
          // Clean up socket using manager
          await socketManager.cleanupSocket(socketKey);
          
        } catch (error) {
          console.error('❌ RTK: MediaSoup session failed:', error);
          
          // Clean up on error
          await socketManager.cleanupSocket(socketKey);
          
          // Update error state
          updateCachedData((draft) => {
            draft.isReady = false;
            draft.isConnected = false;
          });
          
          throw error;
        }
      },
      providesTags: ['Session'],
    }),
    
    // ===== SIMPLE MEDIA PRODUCTION =====
    produceMedia: builder.mutation<{success: boolean; stream?: MediaStream}, {
      sessionData: MediaSoupSession;
      kind: 'video' | 'audio';
      constraints?: MediaTrackConstraints;
    }>({
      queryFn: async ({ sessionData, kind, constraints }, { dispatch }) => {
        try {
          if (!sessionData.sendTransport || !sessionData.isReady) {
            throw new Error('MediaSoup session not ready');
          }
          
          console.log(`🎥 Starting ${kind} production`);
          
          const stream = await navigator.mediaDevices.getUserMedia({
            [kind]: constraints || (kind === 'video' ? { width: 1280, height: 720 } : true)
          });
          
          const track = kind === 'video' ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
          
          if (!track) {
            throw new Error(`No ${kind} track found`);
          }
          
          // Ensure track is not muted
          track.enabled = true;
          
          console.log(`📹 ${kind} track details:`, {
            id: track.id,
            kind: track.kind,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
          
          // Produce the track (triggers sendTransport 'produce' event)
          const producer = await sessionData.sendTransport.produce({ track });
          
          console.log(`✅ ${kind} producer created:`, producer.id);
          
          // Update the session cache with the local stream
          dispatch(mediaSoupApi.util.updateQueryData('mediaSoupSession', {
            serverUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
            roomId: sessionData.roomId,
            userId: sessionData.userId,
            userName: sessionData.userName
          }, (draft) => {
            if (kind === 'video') {
              draft.localVideoStream = stream;
              draft.videoProducer = producer;
            } else {
              draft.localAudioStream = stream;
              draft.audioProducer = producer;
            }
          }));
          
          console.log(`✅ ${kind} production completed, stream stored`);
          return { data: { success: true, stream } };
          
        } catch (error) {
          console.error(`❌ ${kind} production failed:`, error);
          return { error: { status: 'CUSTOM_ERROR', error: (error as Error).message } };
        }
      },
      invalidatesTags: ['Media'],
    }),
    
  }),
});

export const {
  useMediaSoupSessionQuery,
  useProduceMediaMutation,
} = mediaSoupApi;