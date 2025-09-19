/**
 * Modern MediaSoup Hooks with TanStack Query
 * Functional programming approach to WebRTC management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
// import { Device } from 'mediasoup-client';
// import type { RtpCapabilities, Transport } from 'mediasoup-client/lib/types';
import { queryKeys } from '@/lib/queryClient';

// Types for MediaSoup operations (defined manually to avoid import issues)
export interface RtpCapabilities {
  codecs: any[];
  headerExtensions: any[];
}

export interface MediaSoupDevice {
  device: any | null;
  isLoaded: boolean;
  rtpCapabilities: RtpCapabilities | null;
}

export interface MediaSoupTransport {
  id: string;
  transport: any; // MediaSoup Transport type
  type: 'send' | 'receive';
  connected: boolean;
}

export interface MediaSoupProducer {
  id: string;
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
}

export interface MediaSoupConsumer {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
  participantId: string;
}

// MediaSoup Device Management Hook
export const useMediaSoupDevice = () => {
  const deviceRef = useRef<any | null>(null);
  
  return useQuery({
    queryKey: queryKeys.mediaCapabilities(),
    queryFn: async (): Promise<MediaSoupDevice> => {
      // This will be replaced with actual MediaSoup Device import when available
      if (!deviceRef.current) {
        // deviceRef.current = new Device();
        deviceRef.current = { loaded: false }; // Mock for now
      }
      
      return {
        device: deviceRef.current,
        isLoaded: deviceRef.current.loaded || false,
        rtpCapabilities: deviceRef.current.rtpCapabilities || null,
      };
    },
    staleTime: Infinity, // Device doesn't change
    gcTime: Infinity,   // Keep device in memory
  });
};

// RTP Capabilities Hook
export const useRtpCapabilities = (roomId: string | null, socket: any) => {
  return useQuery({
    queryKey: queryKeys.rtpCapabilities(roomId || ''),
    queryFn: (): Promise<RtpCapabilities> => {
      return new Promise((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('RTP capabilities request timeout'));
        }, 10000);

        socket.emit('getRouterRtpCapabilities', (response: unknown) => {
          clearTimeout(timeout);
          
          if (response && typeof response === 'object' && 'codecs' in response) {
            resolve(response as RtpCapabilities);
          } else {
            const res = response as { rtpCapabilities?: RtpCapabilities; error?: string };
            if (res?.error) {
              reject(new Error(res.error));
            } else if (res?.rtpCapabilities) {
              resolve(res.rtpCapabilities);
            } else {
              reject(new Error('Invalid RTP capabilities response'));
            }
          }
        });
      });
    },
    enabled: !!(roomId && socket),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Device Loading Hook
export const useLoadDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ device, rtpCapabilities }: { 
      device: any; 
      rtpCapabilities: RtpCapabilities 
    }) => {
      if (!device.loaded) {
        await device.load({ routerRtpCapabilities: rtpCapabilities });
      }
      return device;
    },
    onSuccess: () => {
      // Invalidate device query to update loaded state
      queryClient.invalidateQueries({ queryKey: queryKeys.mediaCapabilities() });
    },
  });
};

// Transport Creation Hook
export const useCreateTransport = () => {
  return useMutation({
    mutationFn: async ({ 
      socket, 
      producing 
    }: { 
      socket: any; 
      producing: boolean 
    }): Promise<any> => {
      return new Promise((resolve, reject) => {
        socket.emit('createWebRtcTransport', { producing }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
  });
};

// Transport Connection Hook
export const useConnectTransport = () => {
  return useMutation({
    mutationFn: async ({
      socket,
      transportId,
      dtlsParameters,
    }: {
      socket: any;
      transportId: string;
      dtlsParameters: any;
    }) => {
      return new Promise((resolve, reject) => {
        socket.emit('connectTransport', { transportId, dtlsParameters }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
  });
};

// Producer Creation Hook
export const useCreateProducer = () => {
  return useMutation({
    mutationFn: async ({
      socket,
      transportId,
      kind,
      rtpParameters,
    }: {
      socket: any;
      transportId: string;
      kind: 'audio' | 'video';
      rtpParameters: any;
    }) => {
      return new Promise((resolve, reject) => {
        socket.emit('produce', { transportId, kind, rtpParameters }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
  });
};

// Consumer Creation Hook
export const useCreateConsumer = () => {
  return useMutation({
    mutationFn: async ({
      socket,
      producerId,
      rtpCapabilities,
    }: {
      socket: any;
      producerId: string;
      rtpCapabilities: RtpCapabilities;
    }) => {
      return new Promise((resolve, reject) => {
        socket.emit('consume', { producerId, rtpCapabilities }, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
  });
};

// High-level MediaSoup Integration Hook
export const useMediaSoupSession = (roomId: string | null, socket: any) => {
  // Get device
  const { data: deviceData } = useMediaSoupDevice();
  
  // Get RTP capabilities
  const { data: rtpCapabilities, isLoading: rtpLoading } = useRtpCapabilities(roomId, socket);
  
  // Mutations
  const loadDeviceMutation = useLoadDevice();
  const createTransportMutation = useCreateTransport();
  const connectTransportMutation = useConnectTransport();
  const createProducerMutation = useCreateProducer();
  const createConsumerMutation = useCreateConsumer();

  // Initialize device when RTP capabilities are available
  useEffect(() => {
    if (deviceData?.device && rtpCapabilities && !deviceData.isLoaded) {
      loadDeviceMutation.mutate({ 
        device: deviceData.device, 
        rtpCapabilities 
      });
    }
  }, [deviceData, rtpCapabilities, loadDeviceMutation]);

  // Memoized session state
  const sessionState = useMemo(() => ({
    device: deviceData?.device || null,
    isDeviceLoaded: deviceData?.isLoaded || false,
    rtpCapabilities,
    isReady: !!(deviceData?.isLoaded && rtpCapabilities && socket),
    isLoading: rtpLoading || loadDeviceMutation.isPending,
    error: loadDeviceMutation.error,
  }), [deviceData, rtpCapabilities, socket, rtpLoading, loadDeviceMutation]);

  // Session actions
  const sessionActions = useMemo(() => ({
    createTransport: createTransportMutation.mutateAsync,
    connectTransport: connectTransportMutation.mutateAsync,
    createProducer: createProducerMutation.mutateAsync,
    createConsumer: createConsumerMutation.mutateAsync,
    
    // High-level convenience methods
    initializeSendTransport: async () => {
      if (!sessionState.isReady) {
        throw new Error('MediaSoup session not ready');
      }
      
      const transportParams = await createTransportMutation.mutateAsync({
        socket,
        producing: true,
      });
      
      const sendTransport = deviceData!.device!.createSendTransport(transportParams);
      
      // Setup event listeners
      sendTransport.on('connect', ({ dtlsParameters }: any, callback: any) => {
        connectTransportMutation.mutateAsync({
          socket,
          transportId: sendTransport.id,
          dtlsParameters,
        }).then(() => callback()).catch(callback);
      });
      
      sendTransport.on('produce', ({ kind, rtpParameters }: any, callback: any) => {
        createProducerMutation.mutateAsync({
          socket,
          transportId: sendTransport.id,
          kind,
          rtpParameters,
        }).then((response: any) => callback({ id: response.id }))
          .catch(callback);
      });
      
      return sendTransport;
    },
    
    initializeReceiveTransport: async () => {
      if (!sessionState.isReady) {
        throw new Error('MediaSoup session not ready');
      }
      
      const transportParams = await createTransportMutation.mutateAsync({
        socket,
        producing: false,
      });
      
      const recvTransport = deviceData!.device!.createRecvTransport(transportParams);
      
      // Setup event listeners
      recvTransport.on('connect', ({ dtlsParameters }: any, callback: any) => {
        connectTransportMutation.mutateAsync({
          socket,
          transportId: recvTransport.id,
          dtlsParameters,
        }).then(() => callback()).catch(callback);
      });
      
      return recvTransport;
    },
  }), [
    sessionState.isReady,
    createTransportMutation,
    connectTransportMutation,
    createProducerMutation,
    createConsumerMutation,
    deviceData,
    socket,
  ]);

  return {
    ...sessionState,
    ...sessionActions,
  };
};

// Media Stream Management Hook
export const useMediaStreamManager = () => {
  const streamsRef = useRef<Map<string, MediaStream>>(new Map());
  const queryClient = useQueryClient();
  
  const addStream = useCallback((id: string, stream: MediaStream) => {
    streamsRef.current.set(id, stream);
    // Trigger re-render by invalidating a query
    queryClient.invalidateQueries({ queryKey: ['mediaStreams'] });
  }, [queryClient]);
  
  const removeStream = useCallback((id: string) => {
    const stream = streamsRef.current.get(id);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      streamsRef.current.delete(id);
      queryClient.invalidateQueries({ queryKey: ['mediaStreams'] });
    }
  }, [queryClient]);
  
  const getStream = useCallback((id: string) => {
    return streamsRef.current.get(id);
  }, []);
  
  const getAllStreams = useCallback(() => {
    return Array.from(streamsRef.current.entries());
  }, []);
  
  return {
    addStream,
    removeStream,
    getStream,
    getAllStreams,
    streams: streamsRef.current,
  };
};
