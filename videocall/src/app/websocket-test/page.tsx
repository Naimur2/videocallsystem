'use client';

import { SocketMigration } from '@/services/socketMigration';
import { useState } from 'react';

export default function WebSocketTestPage() {
  const [socketIOStatus, setSocketIOStatus] = useState('disconnected');
  const [webSocketStatus, setWebSocketStatus] = useState('disconnected');
  const [socketIOTime, setSocketIOTime] = useState<number | null>(null);
  const [webSocketTime, setWebSocketTime] = useState<number | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev.slice(-10), `${new Date().toISOString().substr(11, 8)} - ${msg}`]);
  };

  const testSocketIO = async () => {
    addMessage('🔌 Testing Socket.IO connection...');
    const startTime = Date.now();
    
    try {
      // This would use your existing Socket.IO setup
      const { io } = await import('socket.io-client');
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      
      socket.on('connect', () => {
        const duration = Date.now() - startTime;
        setSocketIOTime(duration);
        setSocketIOStatus('connected');
        addMessage(`✅ Socket.IO connected in ${duration}ms`);
        
        setTimeout(() => {
          socket.disconnect();
          setSocketIOStatus('disconnected');
          addMessage('🔌 Socket.IO disconnected');
        }, 2000);
      });

      socket.on('connect_error', (error) => {
        setSocketIOStatus('error');
        addMessage(`❌ Socket.IO error: ${error.message}`);
      });

    } catch (error) {
      setSocketIOStatus('error');
      addMessage(`❌ Socket.IO test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testWebSocket = async () => {
    addMessage('🔌 Testing WebSocket connection...');
    const startTime = Date.now();
    
    try {
      const socket = SocketMigration.io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      
      socket.on('connected', () => {
        const duration = Date.now() - startTime;
        setWebSocketTime(duration);
        setWebSocketStatus('connected');
        addMessage(`✅ WebSocket connected in ${duration}ms`);
        
        setTimeout(() => {
          socket.disconnect();
          setWebSocketStatus('disconnected');
          addMessage('🔌 WebSocket disconnected');
        }, 2000);
      });

      socket.on('error', (error: string) => {
        setWebSocketStatus('error');
        addMessage(`❌ WebSocket error: ${error}`);
      });

      await socket.connect();
      
    } catch (error) {
      setWebSocketStatus('error');
      addMessage(`❌ WebSocket test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTimeColor = (time: number | null) => {
    if (!time) return 'text-gray-400';
    if (time < 1000) return 'text-green-600';
    if (time < 2000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            WebSocket vs Socket.IO Performance Test
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Socket.IO Test */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                🔌 Socket.IO Test
                <span className={`ml-2 text-sm ${getStatusColor(socketIOStatus)}`}>
                  ({socketIOStatus})
                </span>
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={testSocketIO}
                  disabled={socketIOStatus === 'connected'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Test Socket.IO Connection
                </button>
                
                {socketIOTime && (
                  <div className="text-center">
                    <span className="text-sm text-gray-600">Connection Time: </span>
                    <span className={`font-bold ${getTimeColor(socketIOTime)}`}>
                      {socketIOTime}ms
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* WebSocket Test */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                ⚡ WebSocket Test
                <span className={`ml-2 text-sm ${getStatusColor(webSocketStatus)}`}>
                  ({webSocketStatus})
                </span>
              </h2>
              
              <div className="space-y-4">
                <button
                  onClick={testWebSocket}
                  disabled={webSocketStatus === 'connected'}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Test WebSocket Connection
                </button>
                
                {webSocketTime && (
                  <div className="text-center">
                    <span className="text-sm text-gray-600">Connection Time: </span>
                    <span className={`font-bold ${getTimeColor(webSocketTime)}`}>
                      {webSocketTime}ms
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
          {socketIOTime && webSocketTime && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">📊 Performance Comparison</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Speed Improvement</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(((socketIOTime - webSocketTime) / socketIOTime) * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Time Saved</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {socketIOTime - webSocketTime}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Winner</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {webSocketTime < socketIOTime ? '⚡ WebSocket' : '🔌 Socket.IO'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Log */}
          <div className="bg-black rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">📝 Test Log</h3>
            <div className="font-mono text-sm text-green-400 space-y-1 max-h-48 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index}>{msg}</div>
              ))}
              {messages.length === 0 && (
                <div className="text-gray-500">Click test buttons to see results...</div>
              )}
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            <h4 className="font-semibold mb-2">💡 What this test shows:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Connection establishment speed comparison</li>
              <li>Network reliability in your environment</li>
              <li>Protocol overhead differences</li>
              <li>Real-world performance in your Docker setup</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}