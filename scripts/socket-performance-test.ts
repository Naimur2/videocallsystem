/**
 * Socket.IO Performance Test Script
 * 
 * Test the optimized Socket.IO configuration for:
 * - WebSocket-only transport
 * - Improved reconnection handling  
 * - Reduced latency and overhead
 */

import { io, Socket } from "socket.io-client";

interface PerformanceMetrics {
  connectionTime: number;
  reconnectionTime: number;
  messageLatency: number[];
  transportType: string;
  messagesReceived: number;
  messagesSent: number;
}

class SocketPerformanceTester {
  private socket?: Socket;
  private metrics: PerformanceMetrics = {
    connectionTime: 0,
    reconnectionTime: 0,
    messageLatency: [],
    transportType: '',
    messagesReceived: 0,
    messagesSent: 0
  };
  
  private connectionStartTime = 0;
  private reconnectionStartTime = 0;

  async testOptimizedConfiguration() {
    console.log('🚀 Testing Socket.IO Optimized Configuration');
    console.log('==========================================');

    // Test 1: Connection Speed
    await this.testConnectionSpeed();
    
    // Test 2: Message Latency
    await this.testMessageLatency();
    
    // Test 3: Reconnection Speed
    await this.testReconnectionSpeed();
    
    // Test 4: WebSocket-only Transport
    await this.testWebSocketOnlyTransport();
    
    // Report Results
    this.reportResults();
  }

  private async testConnectionSpeed(): Promise<void> {
    return new Promise((resolve) => {
      console.log('\n📡 Testing Connection Speed...');
      this.connectionStartTime = Date.now();
      
      this.socket = io('http://localhost:3001', {
        transports: ['websocket'], // WebSocket-only
        timeout: 20000,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        autoConnect: true,
        upgrade: true,
        rememberUpgrade: true,
        forceNew: false,
        closeOnBeforeunload: true,
        upgradeTimeout: 10000,
        maxHttpBufferSize: 1e6,
        connectionStateRecovery: {},
      });

      this.socket.on('connect', () => {
        this.metrics.connectionTime = Date.now() - this.connectionStartTime;
        this.metrics.transportType = this.socket?.io.engine?.transport?.name || 'unknown';
        console.log(`✅ Connected in ${this.metrics.connectionTime}ms`);
        console.log(`🔌 Transport: ${this.metrics.transportType}`);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
        resolve();
      });
    });
  }

  private async testMessageLatency(): Promise<void> {
    if (!this.socket) return;
    
    console.log('\n⚡ Testing Message Latency...');
    
    return new Promise((resolve) => {
      const testMessages = 10;
      let completedTests = 0;
      
      this.socket!.on('test-echo', (data) => {
        const latency = Date.now() - data.timestamp;
        this.metrics.messageLatency.push(latency);
        this.metrics.messagesReceived++;
        completedTests++;
        
        console.log(`📨 Message ${completedTests}/${testMessages} - Latency: ${latency}ms`);
        
        if (completedTests === testMessages) {
          const avgLatency = this.metrics.messageLatency.reduce((a, b) => a + b, 0) / this.metrics.messageLatency.length;
          console.log(`📊 Average Latency: ${avgLatency.toFixed(2)}ms`);
          resolve();
        }
      });
      
      // Send test messages
      for (let i = 0; i < testMessages; i++) {
        setTimeout(() => {
          this.socket!.emit('test-echo', {
            message: `Test message ${i + 1}`,
            timestamp: Date.now()
          });
          this.metrics.messagesSent++;
        }, i * 100); // Send every 100ms
      }
    });
  }

  private async testReconnectionSpeed(): Promise<void> {
    if (!this.socket) return;
    
    console.log('\n🔄 Testing Reconnection Speed...');
    
    return new Promise((resolve) => {
      let reconnected = false;
      
      this.socket!.on('reconnect', () => {
        if (!reconnected) {
          this.metrics.reconnectionTime = Date.now() - this.reconnectionStartTime;
          console.log(`✅ Reconnected in ${this.metrics.reconnectionTime}ms`);
          reconnected = true;
          resolve();
        }
      });
      
      // Force disconnect to test reconnection
      this.reconnectionStartTime = Date.now();
      this.socket!.disconnect();
      
      setTimeout(() => {
        if (!reconnected) {
          console.log('⚠️ Reconnection timeout');
          resolve();
        }
      }, 10000); // 10s timeout
    });
  }

  private async testWebSocketOnlyTransport(): Promise<void> {
    console.log('\n🔍 Verifying WebSocket-only Transport...');
    
    if (this.metrics.transportType === 'websocket') {
      console.log('✅ WebSocket-only transport confirmed');
    } else {
      console.log(`❌ Unexpected transport: ${this.metrics.transportType}`);
    }
    
    // Check if polling is disabled
    const engine = this.socket?.io.engine;
    if (engine) {
      const supportedTransports = (engine as any).transports || [];
      console.log(`🔧 Supported transports: ${supportedTransports.join(', ')}`);
      
      if (supportedTransports.length === 1 && supportedTransports[0] === 'websocket') {
        console.log('✅ Polling successfully disabled');
      } else {
        console.log('⚠️ Polling may still be available');
      }
    }
  }

  private reportResults(): void {
    console.log('\n📊 Performance Test Results');
    console.log('============================');
    console.log(`🔌 Connection Time: ${this.metrics.connectionTime}ms`);
    console.log(`🔄 Reconnection Time: ${this.metrics.reconnectionTime}ms`);
    console.log(`⚡ Average Message Latency: ${this.getAverageLatency().toFixed(2)}ms`);
    console.log(`📡 Transport Type: ${this.metrics.transportType}`);
    console.log(`📨 Messages Sent: ${this.metrics.messagesSent}`);
    console.log(`📥 Messages Received: ${this.metrics.messagesReceived}`);
    
    // Performance benchmarks
    console.log('\n🎯 Performance Benchmarks');
    console.log('==========================');
    console.log(`Connection Speed: ${this.metrics.connectionTime < 2000 ? '✅ PASS' : '❌ FAIL'} (Target: <2s)`);
    console.log(`Reconnection Speed: ${this.metrics.reconnectionTime < 3000 ? '✅ PASS' : '❌ FAIL'} (Target: <3s)`);
    console.log(`Message Latency: ${this.getAverageLatency() < 100 ? '✅ PASS' : '❌ FAIL'} (Target: <100ms)`);
    console.log(`WebSocket Transport: ${this.metrics.transportType === 'websocket' ? '✅ PASS' : '❌ FAIL'}`);
    
    this.socket?.disconnect();
  }

  private getAverageLatency(): number {
    if (this.metrics.messageLatency.length === 0) return 0;
    return this.metrics.messageLatency.reduce((a, b) => a + b, 0) / this.metrics.messageLatency.length;
  }
}

// Run the test if executed directly
if (require.main === module) {
  const tester = new SocketPerformanceTester();
  tester.testOptimizedConfiguration().catch(console.error);
}

export default SocketPerformanceTester;