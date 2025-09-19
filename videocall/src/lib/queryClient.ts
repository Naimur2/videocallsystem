/**
 * TanStack Query Client Configuration
 * Modern API state management for the video calling app
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time for video call data
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Retry configuration for WebRTC operations
      retry: (failureCount, error) => {
        // Don't retry on certain WebRTC errors
        const errorMessage = error?.message?.toLowerCase() || '';
        if (
          errorMessage.includes('permission') ||
          errorMessage.includes('not found') ||
          errorMessage.includes('not supported')
        ) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,
      // Background refetch for participant updates
      refetchInterval: 30000, // 30 seconds
    },
    mutations: {
      // Retry mutations for network issues
      retry: (failureCount, error) => {
        const errorMessage = error?.message?.toLowerCase() || '';
        // Don't retry user actions like join/leave
        if (
          errorMessage.includes('room not found') ||
          errorMessage.includes('already joined')
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Query Keys Factory - Ensures consistent query key management
export const queryKeys = {
  // Room queries
  room: (roomId: string) => ['room', roomId] as const,
  roomParticipants: (roomId: string) => ['room', roomId, 'participants'] as const,
  roomMessages: (roomId: string) => ['room', roomId, 'messages'] as const,
  
  // Media queries
  mediaDevices: () => ['mediaDevices'] as const,
  mediaStream: (userId: string) => ['mediaStream', userId] as const,
  mediaCapabilities: () => ['mediaCapabilities'] as const,
  
  // MediaSoup queries
  rtpCapabilities: (roomId: string) => ['rtpCapabilities', roomId] as const,
  transport: (transportId: string) => ['transport', transportId] as const,
  producer: (producerId: string) => ['producer', producerId] as const,
  consumer: (consumerId: string) => ['consumer', consumerId] as const,
  
  // User queries
  userSession: (userId: string) => ['userSession', userId] as const,
  userDevices: (userId: string) => ['userDevices', userId] as const,
} as const;
