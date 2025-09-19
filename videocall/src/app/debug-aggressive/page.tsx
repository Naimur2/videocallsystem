'use client';

import { useVideoCallStore } from '@/store/videoCallStore';
import { useState } from 'react';

export default function AggressiveDebugPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const {
    socket,
    isSocketConnected,
    isConnected,
    currentRoom,
    localStream,
    messages,
    connect,
    initializeMedia,
    sendMessage,
    joinRoom
  } = useVideoCallStore();

  const addResult = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSocketConnection = async () => {
    addResult("🔌 Testing socket connection...");
    try {
      connect();
      setTimeout(() => {
        if (isSocketConnected) {
          addResult("✅ Socket connected successfully");
        } else {
          addResult("❌ Socket connection failed");
        }
      }, 2000);
    } catch (error) {
      addResult(`❌ Socket connection error: ${error}`);
    }
  };

  const testMediaAccess = async () => {
    addResult("🎥 Testing media access...");
    try {
      const stream = await initializeMedia();
      addResult(`✅ Media access successful - Stream ID: ${stream.id}`);
      addResult(`📹 Video tracks: ${stream.getVideoTracks().length}`);
      addResult(`🎤 Audio tracks: ${stream.getAudioTracks().length}`);
    } catch (error) {
      addResult(`❌ Media access failed: ${error}`);
    }
  };

  const testRoomJoin = async () => {
    addResult("🚪 Testing room join...");
    try {
      const testRoomId = `debug-${Date.now()}`;
      await joinRoom(testRoomId, { 
        name: `Debug-User-${Math.random().toString(36).substr(2, 5)}`,
        email: undefined 
      });
      
      setTimeout(() => {
        if (currentRoom) {
          addResult(`✅ Room join successful - Room: ${currentRoom.id}`);
        } else {
          addResult("❌ Room join failed - no currentRoom set");
        }
      }, 3000);
    } catch (error) {
      addResult(`❌ Room join error: ${error}`);
    }
  };

  const testChat = async () => {
    addResult("💬 Testing chat...");
    try {
      const testMessage = `Test message ${Date.now()}`;
      sendMessage(testMessage);
      addResult(`✅ Chat message sent: ${testMessage}`);
      
      setTimeout(() => {
        const hasMessage = messages.some(m => m.content.includes(testMessage));
        if (hasMessage) {
          addResult("✅ Chat message received back");
        } else {
          addResult("❌ Chat message not received back");
        }
      }, 2000);
    } catch (error) {
      addResult(`❌ Chat test error: ${error}`);
    }
  };

  const runFullTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult("🚀 Starting comprehensive test...");
    
    // Test 1: Socket Connection
    await testSocketConnection();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Media Access
    await testMediaAccess();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Room Join
    await testRoomJoin();
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Test 4: Chat
    await testChat();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    addResult("🏁 Test sequence completed");
    setIsRunning(false);
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🔍 Aggressive Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <button
            onClick={runFullTest}
            disabled={isRunning}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded"
          >
            {isRunning ? "Running Tests..." : "🚀 Run Full Test Suite"}
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={testSocketConnection} className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm">
              🔌 Test Socket
            </button>
            <button onClick={testMediaAccess} className="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm">
              🎥 Test Media
            </button>
            <button onClick={testRoomJoin} className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm">
              🚪 Test Room Join
            </button>
            <button onClick={testChat} className="bg-pink-600 hover:bg-pink-700 px-3 py-2 rounded text-sm">
              💬 Test Chat
            </button>
          </div>
        </div>

        {/* Current State */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="bg-gray-800 p-4 rounded space-y-2 text-sm">
            <div>🔌 Socket Connected: {isSocketConnected ? "✅ Yes" : "❌ No"}</div>
            <div>🏠 Room Connected: {isConnected ? "✅ Yes" : "❌ No"}</div>
            <div>🏠 Current Room: {currentRoom?.id || "None"}</div>
            <div>🎥 Local Stream: {localStream ? `✅ ${localStream.id}` : "❌ None"}</div>
            <div>💬 Messages: {messages.length}</div>
            <div>📡 Socket ID: {socket?.id || "None"}</div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="bg-black p-4 rounded h-96 overflow-y-auto font-mono text-sm">
          {testResults.length === 0 && (
            <div className="text-gray-400">No tests run yet. Click &quot;Run Full Test Suite&quot; to begin.</div>
          )}
          {testResults.map((result, index) => (
            <div key={index} className="mb-1">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}