'use client';

import { socketManager } from '@/lib/socketManager';
import type { ClientToServerEvents, ServerToClientEvents } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export function useSocket(serverUrl?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const initializeSocket = useCallback(() => {
    console.log('[useSocket] Initializing socket connection...');
    
    try {
      const socketInstance = socketManager.connect(serverUrl);
      setSocket(socketInstance);
      
      // Set up event listeners
      const handleConnect = () => {
        console.log('[useSocket] ✅ Connected - Socket ID:', socketInstance.id);
        setIsConnected(true);
        setError(null);
      };
      
      const handleDisconnect = (reason: string) => {
        console.log('[useSocket] ❌ Disconnected - Reason:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          setError('Server disconnected');
        }
      };
      
      const handleConnectError = (err: Error) => {
        console.error('[useSocket] ❌ Connection error:', err);
        setError(`Connection failed: ${err.message}`);
        setIsConnected(false);
      };
      
      // Add event listeners (only the ones that are properly typed)
      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('connect_error', handleConnectError);
      
      // Set initial connection state
      if (socketInstance.connected) {
        setIsConnected(true);
        setError(null);
      }
      
      // Cleanup function
      return () => {
        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
        socketInstance.off('connect_error', handleConnectError);
      };
      
    } catch (err) {
      console.error('[useSocket] ❌ Failed to initialize:', err);
      setError(`Socket initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [serverUrl]);

  useEffect(() => {
    const cleanup = initializeSocket();
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [initializeSocket]);

  return {
    socket,
    isConnected,
    error,
  };
}
